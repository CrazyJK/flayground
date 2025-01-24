package jk.kamoru.ground.flay.service;

import java.io.File;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.base.web.sse.SseEmitters;
import jk.kamoru.ground.flay.FlayException;
import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.image.domain.Image;

@Service
public class FlayActionHandler {

  @Autowired
  FlayAsyncExecutor flayAsyncExecutor;

  @Autowired
  GroundProperties properties;

  @Autowired
  SseEmitters sseEmitters;

  public void play(Flay flay, float seekTime) {
    List<File> movieFileList = flay.getFiles().get(Flay.MOVIE);
    if (movieFileList == null || movieFileList.size() == 0) {
      throw new FlayException("영상 파일이 없습니다");
    }

    String seekOption = "";
    if (seekTime > -1) {
      // 시간 초를 시간 분 초 밀리초로 변경
      long hours = (long) seekTime / 3600;
      long minutes = ((long) seekTime % 3600) / 60;
      long seconds = (long) seekTime % 60;
      long milliseconds = (long) ((seekTime - (long) seekTime) * 1000);

      // /seek=hh:mm:ss.ms : 지정된 시간으로 재생 시작
      seekOption = String.format("/seek=%02d:%02d:%02d.%03d", hours, minutes, seconds, milliseconds);
    }

    flayAsyncExecutor.exec(properties.getPlayerApp().getAbsolutePath(), flay.getFiles().get(Flay.MOVIE).get(0).getAbsolutePath(), seekOption);
    sseEmitters.send(flay);
  }

  public void edit(Flay flay) {
    List<File> subtitlesFileList = flay.getFiles().get(Flay.SUBTI);
    if (subtitlesFileList == null || subtitlesFileList.size() == 0) {
      throw new FlayException("자막 파일이 없습니다");
    }

    flayAsyncExecutor.exec(properties.getEditorApp(), subtitlesFileList.get(0));
    sseEmitters.send(flay);
  }

  public void paint(Image image) {
    flayAsyncExecutor.exec(properties.getPaintApp(), image.getFile());
  }

  public void openFolder(String folder) {
    String explorer = "";
    switch (Ground.OS.SYSTEM) {
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
      throw new FlayException("no specified OS");
    }

    File file = new File(folder);
    if (file.isDirectory()) {
      flayAsyncExecutor.exec(explorer, file.getAbsolutePath());
    } else {
      flayAsyncExecutor.exec(explorer, file.getParent());
    }
  }

}
