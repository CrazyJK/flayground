package jk.kamoru.flayground.net;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Proxy;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.Test;

public class JsoupTorTest {

  // 9051, 9150, 9151
  Proxy torProxy = new Proxy(Proxy.Type.SOCKS, new InetSocketAddress("127.0.0.1", 9150));

  // "https://www.naver.com/"
  final String siteUrl = "https://www.subtitlecat.com/index.php?search=MIAA-005";


  @Test
  public void naver() throws IOException {
    Document document = Jsoup.connect(siteUrl).proxy(torProxy).timeout(180 * 1000).get();
    System.out.println(document.body().html());
  }

}
