package jk.kamoru.flayground.image.download;

import java.io.File;
import java.io.IOException;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.HttpClient;
import org.apache.http.config.SocketConfig;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.scheduling.annotation.Async;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

/**
 * Web page image downloader
 * <pre>Usage
 *  PageImageDownloader pageDownloader = new PageImageDownloader(...);
 *  DownloadResult result = pageDownloader.download();
 * </pre>
 * @author kamoru
 */
@Slf4j
public class PageImageDownloader {

	private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36";
	private static final String ILLEGAL_EXP = "[:\\\\/%*?:|\"<>]";
	private static final int DOCUMENT_TOTAL_REQUEST_TIMEOUT = 60 * 1000;
	private static final int IMAGE_DOWNLOAD_TIMEOUT = 60 * 1000;

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
		this.imagePageUrl  = pageUrl;
		this.localBaseDir  = downloadDir;
		this.folderName    = folderName;
		this.titlePrefix   = titlePrefix;
		this.titleCssQuery = titleCssQuery;
		this.minimumSize   = minimumKbSize * FileUtils.ONE_KB;
	}

	/**
	 * execute download
	 * @return Download result
	 */
	@Async
	public DownloadResult download() {
		log.info("Start download - [{}]", imagePageUrl);
		try {
			// connect and get image page by jsoup HTML parser
			Document document = getDocument(imagePageUrl);

			// decide title
			String title = "";
			if (StringUtils.isBlank(titlePrefix)) {
				if (StringUtils.isBlank(titleCssQuery)) {
					title = document.title();
				} else {
					title = document.select(titleCssQuery).first().text();
				}
			} else {
				title = titlePrefix;
			}
			title = title.replaceAll(ILLEGAL_EXP, "");
			if (StringUtils.isBlank(title)) {
				throw new DownloadException(imagePageUrl, "title is blank");
			}

			// find img tag
			Elements imgTags = document.getElementsByTag("img");
			if (imgTags.size() == 0) {
				throw new DownloadException(imagePageUrl, "no image exist");
			}
			log.info("found imgTags size {}", imgTags.size());

			if (StringUtils.isBlank(localBaseDir)) {
				localBaseDir = FileUtils.getTempDirectoryPath();
			}

			if (StringUtils.isBlank(folderName)) {
				folderName = String.valueOf(System.currentTimeMillis());
			}

			File path = new File(localBaseDir, folderName);
			if (!path.isDirectory()) {
				path.mkdirs();
				log.info("mkdirs {}", path);
			}

			// httpclient
			HttpClient httpClient = createHttpClient(IMAGE_DOWNLOAD_TIMEOUT, imgTags.size(), imgTags.size() / 10);

			// prepare download
			List<ImageDownloader> tasks = new ArrayList<>();
			int count = 0;
			for (Element imgTag : imgTags) {
				String imgSrc = imgTag.attr("src");
				if (StringUtils.isEmpty(imgSrc))
					continue;
				tasks.add(new ImageDownloader(imgSrc, path.getPath(), title + "-" + nf.format(++count), minimumSize, httpClient));
			}

			// execute download
			int nThreads = tasks.size() / 10 + 1;
			log.info("using {} threads", nThreads);

			ExecutorService downloadService = Executors.newFixedThreadPool(nThreads);
			List<Future<File>> files = downloadService.invokeAll(tasks, 5, TimeUnit.MINUTES);
			downloadService.shutdown();

			// check result
			List<File> images = new ArrayList<>();
			for (Future<File> fileFuture : files) {
				File file = fileFuture.get();
				if (file != null)
					images.add(file);
			}
			log.info("{} images downloaded", images.size());

			return DownloadResult.success(imagePageUrl, path.getCanonicalPath(), images);
		} catch (DownloadException e) {
			log.error("Download error", e);
			return DownloadResult.fail(imagePageUrl, e);
		} catch (Exception e) {
			log.error("Error", e);
			return DownloadResult.fail(imagePageUrl, e);
		}
	}

	private Document getDocument(String url) {
		try {
			return Jsoup.connect(url).timeout(DOCUMENT_TOTAL_REQUEST_TIMEOUT).userAgent(USER_AGENT).get();
		} catch (IOException e) {
			throw new DownloadException(url, "could not connect", e);
		}
	}

	/**
	 * create HttpClient
	 * @param maxTotal
	 * @param maxPerRoute
	 * @return
	 */
	private HttpClient createHttpClient(int soTimeout, int maxTotal, int maxPerRoute) {
		// pool setting
		PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
		cm.setMaxTotal(maxTotal);
		cm.setDefaultMaxPerRoute(maxPerRoute);
		// socket setting
		SocketConfig sc = SocketConfig.custom()
			.setSoTimeout(soTimeout)
			.setSoKeepAlive(true)
			.setTcpNoDelay(true)
			.setSoReuseAddress(true)
			.build();

		return HttpClients.custom().setConnectionManager(cm).setDefaultSocketConfig(sc).build();
	}


	/**
	 * result object of {@link PageImageDownloader}
	 */
	@AllArgsConstructor(access = AccessLevel.PRIVATE)
	@Data
	public static class DownloadResult {

		String pageUrl;
		String localPath;
		String message = "";
		Boolean result;
		List<File> images;

		public static DownloadResult success(String url, String downloadeddPath, List<File> images) {
			return new DownloadResult(url, downloadeddPath, "", true, images);
		}

		public static DownloadResult fail(String url, Exception error) {
			return new DownloadResult(url, "", error.getMessage(), false, null);
		}

	}

}
