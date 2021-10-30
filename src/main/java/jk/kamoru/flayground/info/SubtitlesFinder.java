package jk.kamoru.flayground.info;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.lang3.StringUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import jk.kamoru.flayground.Flayground;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
public class SubtitlesFinder {

	final String siteUrl = "https://www.subtitlecat.com";

	@RequestMapping("/file/find/exists/subtitles")
	@ResponseBody
	public List<URL> findSubtitls(@RequestParam("opus") String opus) throws MalformedURLException {
		List<URL> foundUrlList = new ArrayList<>();

		try {
			Document document = Jsoup.connect(siteUrl + "/index.php?search=" + opus).userAgent(Flayground.USER_AGENT).get();
			Elements trList = document.select("table.table.sub-table > tbody > tr");
			log.debug("[{}] page list size {}", opus, trList.size());
			for (Element tr : trList) {
				String text = tr.text();
				log.debug("tr text : {}", text);
				if (StringUtils.containsIgnoreCase(text, opus)) {
					log.debug("   same opus : {}", text);
					if (StringUtils.containsIgnoreCase(text, "Korean")) {
						String href = "/" + tr.select("a").attr("href");
						log.debug("        found kor page : {}", href);

						// file download link
						URL pageUrl = new URL(siteUrl + href);
						Document pageDocument = Jsoup.connect(pageUrl.toString()).userAgent(Flayground.USER_AGENT).get();
						Element anker = pageDocument.selectFirst("#download_ko");
						String downloadLink = anker.attr("href");
						log.debug("              download link : {}", downloadLink);

						foundUrlList.add(new URL(siteUrl + downloadLink));
					}
				}
			}
		} catch (IOException e) {
			log.warn("fail to {} : {}", opus, e.getMessage());
		}

		return foundUrlList;
	}
}
