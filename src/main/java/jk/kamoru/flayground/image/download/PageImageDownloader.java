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
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.scheduling.annotation.Async;

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
				}
				else {
					title = document.select(titleCssQuery).first().text();
				}
			}
			else {
				title = titlePrefix;
			}
			title = title.replaceAll(ILLEGAL_EXP, "");
			if (StringUtils.isBlank(title))
				throw new DownloadException(imagePageUrl, "title is blank");

			// find img tag
			Elements imgTags = document.getElementsByTag("img");
			if (imgTags.size() == 0)
				throw new DownloadException(imagePageUrl, "no image exist");
			else 
				log.info("found imgTags size {}", imgTags.size());
			
			if (StringUtils.isBlank(localBaseDir))
				localBaseDir = FileUtils.getTempDirectoryPath(); 
			
			if (StringUtils.isBlank(folderName))
				folderName = String.valueOf(System.currentTimeMillis()); 

			File path = new File(localBaseDir, folderName);
			if (!path.isDirectory()) {
				path.mkdirs();
				log.info("mkdirs {}", path);
			}

			// prepare download
			List<ImageDownloader> tasks = new ArrayList<>();
			int count = 0;
			for (Element imgTag : imgTags) {
				String imgSrc = imgTag.attr("src");
				if (StringUtils.isEmpty(imgSrc)) 
					continue;
				tasks.add(new ImageDownloader(imgSrc, path.getPath(), title + "-" + nf.format(++count), minimumSize));
			}

			// execute download
			int nThreads = tasks.size() < 10 ? 1 : tasks.size() / 10;			
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
			return new DownloadResult(imagePageUrl, path.getCanonicalPath(), "Success", true, images);
		
		} catch (DownloadException e) {
			log.error("Download error", e);
			return new DownloadResult(imagePageUrl, "", e.getMessage(), false, null);
		} catch (Exception e) {
			log.error("Error", e);
			return new DownloadResult(imagePageUrl, "", e.getMessage(), false, null);
		}
	}
	
	private Document getDocument(String url) {
		try {
			return Jsoup.connect(url).timeout(60 * 1000).userAgent(USER_AGENT).get();
		} catch (IOException e) {
			throw new DownloadException(url, "could not connect", e);
		}
	}
	
	/**
	 * result object of {@link PageImageDownloader}
	 */
	@AllArgsConstructor
	@Data
	public class DownloadResult {
		String pageUrl;
		String localPath;
		String message = "";
		Boolean result;
		List<File> images;
	}

}
