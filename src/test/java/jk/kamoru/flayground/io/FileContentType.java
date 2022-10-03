package jk.kamoru.flayground.io;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.junit.jupiter.api.Test;

public class FileContentType {

  @Test
  void test() throws IOException {
    Path path = Paths.get("J:\\Crazy\\Stage\\2021\\[溜池ゴロー][MEYD-651][무수정. 단지 아내와 잉키 아저씨의 땀 투성이 농후 질내 사정][Yamagishi Aika][2021.02.13].srt");
    String probeContentType = Files.probeContentType(path);
    System.out.println(probeContentType);
  }
}
