package jk.kamoru.ground.flay.service;

import java.io.File;
import java.io.IOException;
import java.lang.ProcessBuilder.Redirect;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import jk.kamoru.ground.flay.FlayException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class FlayAsyncExecutor {

  @Async
  public void exec(File app, List<File> arguments) {
    exec(app.getAbsolutePath(), arguments.stream().map(File::getAbsolutePath).toArray(String[]::new));
  }

  @Async
  public void exec(File app, File... arguments) {
    exec(app.getAbsolutePath(), Stream.of(arguments).map(File::getAbsolutePath).toArray(String[]::new));
  }

  @Async
  public void exec(File app, String... arguments) {
    exec(app.getAbsolutePath(), arguments);
  }

  @Async
  public void exec(String app, String... arguments) {
    List<String> commands = new ArrayList<>();
    commands.add(app);
    for (String argument : arguments) {
      commands.add(argument);
    }
    execute(commands);
  }

  private void execute(List<String> commands) {
    try {
      Process process = new ProcessBuilder(commands).redirectOutput(Redirect.INHERIT).redirectError(Redirect.INHERIT).start();
      log.info("exec {}", commands);
      log.debug("process {}", process.info());
    } catch (IOException e) {
      log.error("exec error", e);
      throw new FlayException("exec error", e);
    }
  }

}
