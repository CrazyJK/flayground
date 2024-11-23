package jk.kamoru.ground.crawling;

import java.io.IOException;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundProperties;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@io.swagger.v3.oas.annotations.tags.Tag(name = "CrawlingDocument")
@RestController
public class CrawlingDocument {

  @Autowired
  GroundProperties properties;

  @Autowired
  CurlResponser curlResponser;

  @GetMapping("/crawling/jsoup")
  @ResponseBody
  Document getDocumentByJsoup(@RequestParam("url") String url) throws IOException {
    log.info("crawling jsoup {}", url);
    return Jsoup.connect(url).userAgent(Ground.USER_AGENT).timeout(properties.getJsoupTimeout() * 1000).get();
  }

  @GetMapping("/crawling/curl")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void getDocumentByCurl(@RequestParam("url") String url) {
    log.info("crawling curl {}", url);
    curlResponser.exec(url);
  }
}
