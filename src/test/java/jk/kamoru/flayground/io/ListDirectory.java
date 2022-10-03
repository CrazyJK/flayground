package jk.kamoru.flayground.io;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.time.StopWatch;
import org.junit.jupiter.api.Test;

public class ListDirectory {

  @Test
  void test() throws IOException {
    Path dir = Paths.get("K:\\Crazy\\Archive");
    StopWatch sw = new StopWatch();

    sw.start();
    List<Path> collect = Files.list(dir).filter(Files::isDirectory).collect(Collectors.toList());
    for (Path p : collect) {
      System.out.println(p);
    }
    sw.stop();
    System.out.println(sw.getTime());


    System.out.println("------------------------------------------------------------------------------");

    sw.reset();
    sw.start();
    List<File> collect2 = Files.walk(dir).filter(Files::isDirectory).map(Path::toFile).collect(Collectors.toList());
    for (File p : collect2) {
      System.out.println(p);
    }
    sw.stop();
    System.out.println(sw.getTime());

  }
}
