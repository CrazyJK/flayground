package jk.kamoru.ground.flay.source;

import java.io.File;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.history.domain.History;
import jk.kamoru.ground.history.service.HistoryService;
import jk.kamoru.ground.info.domain.Actress;
import jk.kamoru.ground.info.domain.Studio;
import jk.kamoru.ground.info.domain.Video;
import jk.kamoru.ground.info.source.InfoSource;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class FlayFactory {

  @Autowired
  InfoSource<Video, String> videoInfoSource;
  @Autowired
  InfoSource<Studio, String> studioInfoSource;
  @Autowired
  InfoSource<Actress, String> actressInfoSource;
  @Autowired
  HistoryService historyService;

  protected Flay newFlay(FlayFileResult result, boolean isArchive) {
    Flay flay = new Flay();
    flay.setStudio(getStudio(result.studio));
    flay.setOpus(result.opus);
    flay.setTitle(result.title);
    flay.setActressList(getActressList(result.actress));
    flay.setRelease(result.release);
    flay.setVideo(getVideo(result.opus, isArchive));
    flay.setArchive(isArchive);
    return flay;
  }

  private String getStudio(String name) {
    return studioInfoSource.getOrNew(name).getName();
  }

  private List<String> getActressList(String actress) {
    List<String> list = new ArrayList<>();
    for (String name : StringUtils.split(actress, ",")) {
      String onePerson = String.join(" ", StringUtils.split(name));
      String actressName = actressInfoSource.getOrNew(onePerson).getName();
      list.add(actressName);
    }
    return list;
  }

  private Video getVideo(String opus, boolean isArchive) {
    Video video = videoInfoSource.getOrNew(opus);
    if (!isArchive) {
      long lastPlayTime = -1;
      History lastPlayHistory = historyService.findLastPlay(opus);
      if (lastPlayHistory != null) {
        try {
          lastPlayTime = Ground.Format.Date.DateTime.parse(lastPlayHistory.getDate()).getTime();
        } catch (ParseException e) {
          log.error("fail to parse", e);
        }
      }
      video.setLastPlay(lastPlayTime);
    }
    return video;
  }

  protected void addFile(Flay flay, File file) {
    if (Ground.FILE.isVideo(file)) {
      flay.addMovieFile(file);
    } else if (Ground.FILE.isSubtitles(file)) {
      flay.addSubtitlesFile(file);
    } else if (Ground.FILE.isImage(file)) {
      flay.addCoverFile(file);
    } else {
      log.warn("unknown file {} -> {}", flay.getOpus(), file);
    }
  }

}
