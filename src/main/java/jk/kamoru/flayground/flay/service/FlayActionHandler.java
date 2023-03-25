package jk.kamoru.flayground.flay.service;

import java.io.File;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.base.web.sse.SseEmitters;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.image.domain.Image;

@Service
public class FlayActionHandler {

  @Autowired
  FlayAsyncExecutor flayAsyncExecutor;

  @Autowired
  FlayProperties flayProperties;

  @Autowired
  SseEmitters sseEmitters;

  public void play(Flay flay) {
    flayAsyncExecutor.exec(flayProperties.getPlayerApp(), flay.getFiles().get(Flay.MOVIE));
    sseEmitters.send(flay);
  }

  public void edit(Flay flay) {
    flayAsyncExecutor.exec(flayProperties.getEditorApp(), flay.getFiles().get(Flay.SUBTI));
    sseEmitters.send(flay);
  }

  public void paint(Image image) {
    flayAsyncExecutor.exec(flayProperties.getPaintApp(), image.getFile());
  }

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
      flayAsyncExecutor.exec(explorer, file.getAbsolutePath());
    } else {
      flayAsyncExecutor.exec(explorer, file.getParent());
    }
  }

}
