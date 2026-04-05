package jk.kamoru.ground.crawling;

import java.io.File;
import java.lang.ProcessBuilder.Redirect;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Future;

import org.apache.commons.io.FileUtils;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import jk.kamoru.ground.base.web.sse.LogAndSse;
import jk.kamoru.ground.flay.FlayException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CurlResponser extends LogAndSse {

  @Async
  public void exec(String urlStr) {
    try {
      File contentFile = File.createTempFile("crawling.curl.", ".html");
      // curl -o 1page.html "https://www.nanojav.com/jav/?order=new&page=1"
      List<String> command = Arrays.asList("curl", "-o", contentFile.getAbsolutePath(), urlStr);
      log.info("command {}", command);

      Process process = new ProcessBuilder(command).redirectOutput(Redirect.INHERIT).redirectError(Redirect.INHERIT).start();

      Future<Boolean> identical = process.onExit().thenApply(p -> p.exitValue() == 0);
      if (identical.get()) {
        String html = Files.readString(contentFile.toPath());
        curlLogger(html);
        FileUtils.deleteQuietly(contentFile);
      } else {
        throw new FlayException("curl error, exit code: " + process.exitValue());
      }
    } catch (Exception e) {
      log.error("error", e);
      throw new FlayException("exec error", e);
    }
  }
}
