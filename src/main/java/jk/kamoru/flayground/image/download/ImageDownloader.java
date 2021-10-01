package jk.kamoru.flayground.image.download;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.HttpClients;

import lombok.extern.slf4j.Slf4j;

/**
 * Web image downloader
 *
 * <pre>
 * Usage
 *
 *   ImageDownloader downloader = new ImageDownloader("url string", "dest string");
 *   File file = downloader.download();
 *
 * or using ExecutorService
 *
 *   ExecutorService service = Executors.newFixedThreadPool(1);
 *   Future<File> fileFuture = service.submit(downloader);
 *   service.shutdown();
 *   File file = fileFuture.get();
 * </pre>
 *
 * @author kamoru
 */
@Slf4j
public class ImageDownloader implements Callable<File> {

	/** default image suffix */
	public static final String DEFAULT_IMAGE_SUFFIX = "jpg";

	/** image suffix list. "png", "jpg", "jpeg", "gif", "webp", "bmp" */
	private static final List<String> IMAGE_SUFFIX_LIST = Arrays.asList("png", "jpg", "jpeg", "gif", "webp", "bmp");

	private String imgSrc;
	private String destDir;
	private String title;
	private long minimumSize;
	private HttpClient httpClient;

	private Map<String, String> headers = new HashMap<>();

	/**
	 * Constructs a new <code>ImageDownloader</code> using image source<br>
	 * execute {@link #download()} or using {@link java.util.concurrent.ExecutorService ExecutorService}
	 *
	 * @param imgSrc image source url
	 */
	public ImageDownloader(String imgSrc) {
		this(imgSrc, null, null, 0);
	}


	/**
	 * Constructs a new <code>ImageDownloader</code> using image source, destination directory<br>
	 * execute {@link #download()} or using {@link java.util.concurrent.ExecutorService ExecutorService}
	 *
	 * @param imgSrc image source url
	 * @param destDir destination directory
	 */
	public ImageDownloader(String imgSrc, String destDir) {
		this(imgSrc, destDir, null, 0);
	}

	/**
	 * Constructs a new <code>ImageDownloader</code> using image source, destination directory,
	 * title<br>
	 * execute {@link #download()} or using {@link java.util.concurrent.ExecutorService ExecutorService}
	 *
	 * @param imgSrc image source url
	 * @param destDir destination directory
	 * @param title image title
	 */
	public ImageDownloader(String imgSrc, String destDir, String title) {
		this(imgSrc, destDir, title, 0);
	}

	/**
	 * Constructs a new <code>ImageDownloader</code> using image source, destination directory,
	 * title<br>
	 * execute {@link #download()} or using {@link java.util.concurrent.ExecutorService ExecutorService}
	 *
	 * @param imgSrc image source url
	 * @param destDir destination directory
	 * @param title image title
	 * @param minimunSize minimum image size(bytes)
	 */
	public ImageDownloader(String imgSrc, String destDir, String title, long minimunSize) {
		this(imgSrc, destDir, title, 0, null);
	}

	public ImageDownloader(String imgSrc, String destDir, String title, long minimunSize, HttpClient httpClient) {
		this.imgSrc = imgSrc;
		this.destDir = destDir;
		this.title = title;
		this.minimumSize = minimunSize;
		this.httpClient = httpClient;
	}

	/**
	 * if image size is smaller than minimumSize, do not download
	 *
	 * @param minimumSize bytes
	 */
	public void setMinimumSize(int minimumSize) {
		this.minimumSize = minimumSize;
	}

	public void setHttpClient(HttpClient httpClient) {
		this.httpClient = httpClient;
	}

	public void setHeaders(Map<String, String> headerMap) {
		this.headers = headerMap;
	}

	public void addHeader(String key, String value) {
		this.headers.put(key, value);
	}

	@Override
	public File call() throws Exception {
		return download();
	}

	/**
	 * execute download
	 *
	 * @return image file. if error, <code>null</code>
	 */
	public File download() {
		log.info("downloading... {}", imgSrc);

		File imageFile = null;

		try {
			if (httpClient == null) {
				httpClient = HttpClients.createMinimal();
			}

			// Execute a request of image
			HttpGet httpGet = new HttpGet(imgSrc);

			if (headers.size() > 0) {
				headers.forEach((name, value) -> {
					httpGet.setHeader(name, value);
				});
			}

			HttpResponse httpResponse = httpClient.execute(httpGet);

			/* Test Code : All Header info */
			Header[] headers = httpResponse.getAllHeaders();
			for (Header header : headers) {
				log.debug("Header info : {}={}", header.getName(), header.getValue());
			}

			// check status code
			int statusCode = httpResponse.getStatusLine().getStatusCode();
			if (statusCode != 200) {
				throw new DownloadException(imgSrc, "response status code is " + statusCode);
			}

			// check response entity and size of entiry
			HttpEntity entity = httpResponse.getEntity();
			if (entity == null) {
				throw new DownloadException(imgSrc, "Entity is null");
			}
			if (0 < minimumSize && entity.getContentLength() < minimumSize) {
				throw new DownloadException(imgSrc, "content bytes is small. " + entity.getContentLength() + " < " + minimumSize);
			}

			// is image file, find content-type
			Header contentTypeHeader = httpResponse.getLastHeader("Content-Type");
			String contentType = contentTypeHeader.getValue();
			if (contentType == null) {
				throw new DownloadException(imgSrc, "Content-Type is null");
			} else if ("audio/unknown".equals(contentType)) { // maybe webp
				contentType = "image/webp";
			} else if (!contentType.startsWith("image")) {
				throw new DownloadException(imgSrc, "Content-Type is not a image type. " + contentType);
			}

			// make title
			if (title == null) {
				title = StringUtils.substringAfterLast(imgSrc, "/");
			}
			String suffix = StringUtils.substringAfterLast(title, ".");
			if (!IMAGE_SUFFIX_LIST.contains(suffix.toLowerCase())) {
				// find suffix in header
				suffix = StringUtils.substringAfterLast(contentType, "/");
				if (StringUtils.isEmpty(suffix)) {
					title += "." + DEFAULT_IMAGE_SUFFIX;
				} else {
					title += "." + suffix;
				}
			}

			// destination path
			File destPath = destDir == null ? FileUtils.getTempDirectory() : new File(destDir);
			if (!destPath.isDirectory()) {
				throw new DownloadException(imgSrc, "destination is not a directory. " + destDir);
			}

			// save image file
			imageFile = new File(destPath, title);

			FileUtils.copyInputStreamToFile(entity.getContent(), imageFile);
			log.info("downloaded. save as {} from {}", imageFile.getAbsolutePath(), imgSrc);
		} catch (IOException e) { // httpClient.execute(httpGet); outputstream error
			log.error("download fail: {} - {}", e.getMessage(), imgSrc);
		} catch (DownloadException e) {
			log.error("download fail: {}", e.getMessage());
		}
		return imageFile;
	}

}
