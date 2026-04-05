package jk.kamoru.ground.flay.service;

import java.io.File;
import java.lang.ProcessBuilder.Redirect;
import java.lang.ProcessHandle.Info;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Future;
import java.util.stream.Stream;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import jk.kamoru.ground.base.web.sse.LogAndSse;
import jk.kamoru.ground.flay.FlayException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class FlayAsyncExecutor extends LogAndSse {

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

  private void execute(List<String> command) {
    log.info("execute {}", command);
    try {
      Process process = new ProcessBuilder(command).redirectOutput(Redirect.INHERIT).redirectError(Redirect.INHERIT).start();

      Future<Boolean> identical = process.onExit().thenApply(p -> p.exitValue() == 0);
      if (identical.get()) {
        log.info("process is exited");

        final Info info = process.info();
        log.debug("process info {}", info);

        final Instant start = info.startInstant().get();
        final Instant end = Instant.now();
        final Duration runDuration = Duration.between(start, end);
        log.debug("process run time {}s", runDuration.getSeconds());

        final Duration cpuDuration = info.totalCpuDuration().get();
        log.debug("process CPU time {}s", cpuDuration.getSeconds());

        noticeLogger("process run time " + runDuration.getSeconds() + "s");
      }
    } catch (Exception e) {
      log.error("exec error", e);
      throw new FlayException("exec error", e);
    } finally {
      log.info("execute end");
    }
  }

}
