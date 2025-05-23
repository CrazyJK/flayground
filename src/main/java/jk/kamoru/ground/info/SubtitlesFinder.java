package jk.kamoru.ground.info;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundProperties;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@io.swagger.v3.oas.annotations.tags.Tag(name = "SubtitlesFinder")
@RestController
@RequestMapping(Ground.API_PREFIX)
public class SubtitlesFinder {

  @Autowired
  GroundProperties properties;

  final String siteUrl = "https://www.subtitlecat.com";

  Proxy torProxy = new Proxy(Proxy.Type.SOCKS, new InetSocketAddress("127.0.0.1", 9150));

  @GetMapping("/file/find/exists/subtitles")
  @ResponseBody
  public Map<String, Object> findSubtitls(@RequestParam("opus") String opus) {
    Map<String, Object> result = new HashMap<>();

    try {
      List<URL> foundUrlList = new ArrayList<>();
      Document document = getDocument(siteUrl + "/index.php?search=" + opus);
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
            Document pageDocument = getDocument(pageUrl.toString());
            Element anker = pageDocument.selectFirst("#download_ko");
            String downloadLink = anker.attr("href");
            log.debug("              download link : {}", downloadLink);

            foundUrlList.add(new URL(siteUrl + downloadLink));
          }
        }
      }
      result.put("error", "");
      result.put("url", foundUrlList);
    } catch (IOException e) {
      log.warn("fail to {} : {}", opus, e.getMessage());
      result.put("error", e.getMessage());
    }

    return result;
  }

  @PatchMapping("/file/find/exists/subtitles/config")
  public Map<String, Object> setConfig(@RequestParam(required = false) Boolean useTorProxy, @RequestParam(required = false) Integer jsoupTimeout) {
    if (useTorProxy != null) {
      properties.setUseTorProxy(useTorProxy);
    }
    if (jsoupTimeout != null) {
      properties.setJsoupTimeout(jsoupTimeout);
    }
    Map<String, Object> map = new HashMap<>();
    map.put("useTorProxy", properties.isUseTorProxy());
    map.put("jsoupTimeout", properties.getJsoupTimeout());
    return map;
  }

  private Document getDocument(String url) throws IOException {
    Connection jsoupConnect = Jsoup.connect(url);
    if (properties.isUseTorProxy()) {
      jsoupConnect.proxy(torProxy);
    }
    return jsoupConnect.userAgent(Ground.USER_AGENT).timeout(properties.getJsoupTimeout() * 1000).get();
  }

}
