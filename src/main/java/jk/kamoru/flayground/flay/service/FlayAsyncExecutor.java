package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.io.IOException;
import java.lang.ProcessBuilder.Redirect;
import java.util.Arrays;
import java.util.List;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class FlayAsyncExecutor {

  @Async
  public void exec(File command, File... files) {
    exec(command.getAbsolutePath(), files);
  }

  @Async
  public void exec(String command, File... files) {
    List<String> commands = Arrays.asList(command);
    if (files != null) {
      for (File file : files) {
        commands.add(file.getAbsolutePath());
      }
    }
    exec(commands);
  }

  @Async
  public void exec(File command, List<File> files) {
    exec(command.getAbsolutePath(), files);
  }

  @Async
  public void exec(String command, List<File> files) {
    List<String> commands = Arrays.asList(command);
    if (files != null) {
      for (File file : files) {
        commands.add(file.getAbsolutePath());
      }
    }
    exec(commands);
  }

  @Async
  public void exec(File command, String... arguments) {
    exec(command.getAbsolutePath(), arguments);
  }

  @Async
  public void exec(String command, String... arguments) {
    List<String> commands = Arrays.asList(command);
    if (arguments != null) {
      commands.addAll(Arrays.asList(arguments));
    }
    exec(commands);
  }

  private void exec(List<String> commands) {
    try {
      Process process = new ProcessBuilder(commands)
          .redirectOutput(Redirect.INHERIT)
          .redirectError(Redirect.INHERIT)
          .start();
      log.debug("process {}", process.info());
      log.info("exec {}", commands);
    } catch (IOException e) {
      log.error("exec error", e);
      throw new IllegalStateException("exec error", e);
    }
  }

}
