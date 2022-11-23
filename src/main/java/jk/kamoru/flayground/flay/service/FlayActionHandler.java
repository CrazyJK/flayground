package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.io.IOException;
import java.lang.ProcessBuilder.Redirect;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.base.web.socket.topic.message.TopicMessageService;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.image.domain.Image;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FlayActionHandler {

  @Autowired
  FlayProperties flayProperties;

  @Autowired
  TopicMessageService topicMessageService;

  public void play(Flay flay) {
    exec(composite(flayProperties.getPlayerApp(), flay.getFiles().get(Flay.MOVIE)));
    topicMessageService.sendFromServerToCurrentUser("Play " + flay.getOpus(), flay.getFullname());
  }

  public void edit(Flay flay) {
    exec(composite(flayProperties.getEditorApp(), flay.getFiles().get(Flay.SUBTI)));
    topicMessageService.sendFromServerToCurrentUser("Edit " + flay.getOpus(), flay.getFullname());
  }

  public void paint(Image image) {
    exec(composite(flayProperties.getPaintApp(), Arrays.asList(image.getFile())));
    topicMessageService.sendFromServerToCurrentUser("Paint " + image.getName(), image.getPath());
  }

  @Async
  public void openFolder(String folder) {
    String explorer = "";
    switch (Flayground.OS.SYSTEM) {
      case WINDOWS:
        explorer = "explorer";
        break;
      case LINUX:
        explorer = "nemo";
        break;
      case MAC:
        explorer = "open";
        break;
      default:
        throw new IllegalStateException("no specified OS");
    }

    File file = new File(folder);
    if (file.isDirectory()) {
      exec(Arrays.asList(explorer, file.getAbsolutePath()));
    } else {
      exec(Arrays.asList(explorer, file.getParent()));
    }
  }

  @Async
  public void exec(List<String> commands) {
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

  private List<String> composite(File command, List<File> files) {
    return composite(command.getAbsolutePath(), files);
  }

  private List<String> composite(String command, List<File> files) {
    List<String> commands = new ArrayList<>();
    commands.add(command);
    for (File file : files) {
      commands.add(file.getAbsolutePath());
    }
    return commands;
  }

}
