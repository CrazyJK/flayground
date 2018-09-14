package jk.kamoru.flayground.image;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.image.download.PageImageDownloader;
import jk.kamoru.flayground.image.download.PageImageDownloader.DownloadResult;

@RestController
@RequestMapping("/image")
public class PageImageDownloadController {

	@GetMapping("/pageImageDownload")
	public DownloadResult pageImageDownload(
			@RequestParam String pageUrl, 
			@RequestParam String downloadDir, 
			@RequestParam String folderName,
			@RequestParam String titlePrefix,
			@RequestParam String titleCssQuery,
			@RequestParam int minimumKbSize) {
		return new PageImageDownloader(pageUrl, downloadDir, folderName, titlePrefix, titleCssQuery, minimumKbSize).download();
	}

}
