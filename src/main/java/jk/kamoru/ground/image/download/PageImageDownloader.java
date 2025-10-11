package jk.kamoru.ground.image.download;

import java.io.File;
import java.net.URI;
import java.net.URL;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import jk.kamoru.ground.Ground;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

/**
 * Web page image downloader
 *
 * <pre>
 * Usage
 *  PageImageDownloader pageDownloader = new PageImageDownloader(...);
 *  DownloadResult result = pageDownloader.download();
 * </pre>
 *
 * @author kamoru
 */
@Slf4j
public class PageImageDownloader {

  private static final String ILLEGAL_EXP = "[:\\\\/%*?:|\"<>]";
  private static final int DOCUMENT_TIMEOUT = 1000 * 60;
  private static final long THREAD_POOL_TIMEOUT = 1000 * 60 * 1;
  private static final int IMAGE_TIMEOUT_SECOND = 60;

  static NumberFormat nf = NumberFormat.getNumberInstance();

  static {
    nf.setMinimumIntegerDigits(4);
    nf.setGroupingUsed(false);
  }

  String imagePageUrl;
  String localBaseDir;
  String folderName;
  String titlePrefix;
  String titleCssQuery;
  long minimumSize;

  public PageImageDownloader(String pageUrl, String downloadDir, String folderName, String titlePrefix, String titleCssQuery, int minimumKbSize) {
    this.imagePageUrl = pageUrl;
    this.localBaseDir = downloadDir;
    this.folderName = folderName;
    this.titlePrefix = titlePrefix;
    this.titleCssQuery = titleCssQuery;
    this.minimumSize = minimumKbSize * FileUtils.ONE_KB;
  }

  /**
   * execute download
   *
   * @return Download result
   */
  public DownloadResult download() {
    log.info("Image download start - [{}]", imagePageUrl);
    try {
      final URL url = URI.create(imagePageUrl).toURL();
      final String domain = String.format("%s://%s%s", url.getProtocol(), url.getHost(), (url.getPort() > 0 ? ":" + url.getPort() : ""));

      // connect and get image page by jsoup HTML parser
      Document document = Jsoup.connect(imagePageUrl).timeout(DOCUMENT_TIMEOUT).userAgent(Ground.USER_AGENT).get();

      // find img tag
      Elements imgTags = document.getElementsByTag("img");
      int imgTagSize = imgTags.size();
      if (imgTagSize == 0) {
        throw new DownloadException(imagePageUrl, "no image exist");
      }
      log.info("found {} img tags", imgTagSize);

      // decide title
      titlePrefix = StringUtils.defaultIfBlank(titlePrefix, StringUtils.isBlank(titleCssQuery) ? document.title() : document.select(titleCssQuery).first().text());
      titlePrefix = StringUtils.defaultIfBlank(titlePrefix, imagePageUrl);
      titlePrefix = titlePrefix.replaceAll(ILLEGAL_EXP, "");
      titlePrefix = StringUtils.join(StringUtils.split(titlePrefix), "_");
      log.info("decide title prefix [{}]", titlePrefix);

      localBaseDir = StringUtils.defaultIfBlank(localBaseDir, FileUtils.getTempDirectoryPath());
      folderName = StringUtils.defaultIfBlank(folderName, String.valueOf(System.currentTimeMillis()));

      File path = new File(localBaseDir, folderName);
      if (!path.exists() || !path.isDirectory()) {
        path.mkdirs();
      }
      log.info("storage path is {}", path);

      // get httpclient
      HttpClient httpClient = createHttpClient(IMAGE_TIMEOUT_SECOND, imgTagSize);

      // prepare download
      List<String> imageUrls = new ArrayList<>();
      List<ImageDownloader> tasks = new ArrayList<>();
      int count = 0;
      for (Element imgTag : imgTags) {
        String imgSrc = imgTag.attr("abs:src");
        if (StringUtils.isEmpty(imgSrc))
          continue;
        if (imgSrc.startsWith("/")) {
          imgSrc = domain + imgSrc;
        }
        imageUrls.add(imgSrc);
        tasks.add(new ImageDownloader(imgSrc, path.getPath(), titlePrefix + "-" + nf.format(++count), minimumSize, httpClient));
      }

      // execute download
      int nThreads = tasks.size(); // / 10 + 1;
      log.info("using {} threads for {} image url", nThreads, tasks.size());

      ExecutorService downloadService = Executors.newFixedThreadPool(nThreads);
      List<Future<File>> files = downloadService.invokeAll(tasks, THREAD_POOL_TIMEOUT, TimeUnit.MILLISECONDS);
      downloadService.shutdown();

      // check result
      List<File> imageFiles = new ArrayList<>();
      for (Future<File> fileFuture : files) {
        File file = fileFuture.get();
        if (file != null) {
          imageFiles.add(file);
        }
      }
      log.info("Image download end. {} downloaded. {} fail", imageFiles.size(), files.size() - imageFiles.size());

      return DownloadResult.success(imagePageUrl, path.getCanonicalPath(), imageFiles, imageUrls);
    } catch (CancellationException e) {
      log.error("Download timeout " + e.getMessage());
      return DownloadResult.fail(imagePageUrl, e);
    } catch (DownloadException e) {
      log.error("Download error", e);
      return DownloadResult.fail(imagePageUrl, e);
    } catch (Exception e) {
      log.error("Error", e);
      return DownloadResult.fail(imagePageUrl, e);
    }
  }

  /**
   * create HttpClient
   *
   * @param soTimeout
   * @param maxTotal
   * @return CloseableHttpClient
   */
  private HttpClient createHttpClient(int soTimeout, int maxTotal) {
    // pool setting
    PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
    cm.setMaxTotal(maxTotal);
    cm.setDefaultMaxPerRoute(maxTotal);
    return HttpClients.createMinimal(cm);
  }

  /**
   * result object of {@link PageImageDownloader}
   */
  @AllArgsConstructor(access = AccessLevel.PRIVATE)
  @Data
  public static class DownloadResult {

    String pageUrl;
    String localPath;
    String message;
    Boolean result;
    List<File> imageFiles;
    List<String> imageUrls;

    public static DownloadResult success(String url, String downloadedPath, List<File> imageFiles, List<String> imageUrls) {
      return new DownloadResult(url, downloadedPath, "", true, imageFiles, imageUrls);
    }

    public static DownloadResult fail(String url, Exception error) {
      return new DownloadResult(url, "", error.getMessage(), false, null, null);
    }

  }

}
