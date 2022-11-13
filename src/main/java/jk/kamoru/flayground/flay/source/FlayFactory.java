package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.history.domain.History;
import jk.kamoru.flayground.history.service.HistoryService;
import jk.kamoru.flayground.info.domain.Actress;
import jk.kamoru.flayground.info.domain.Studio;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.source.InfoSource;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FlayFactory {

  @Autowired InfoSource<Video, String> videoInfoSource;
  @Autowired InfoSource<Studio, String> studioInfoSource;
  @Autowired InfoSource<Actress, String> actressInfoSource;
  @Autowired HistoryService historyService;

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
          lastPlayTime = Flayground.Format.Date.DateTime.parse(lastPlayHistory.getDate()).getTime();
        } catch (ParseException e) {
          log.error("fail to parse", e);
        }
      }
      video.setLastPlay(lastPlayTime);
    }
    return video;
  }

  protected void addFile(Flay flay, File file) {
    if (Flayground.FILE.isVideo(file)) {
      flay.addMovieFile(file);
    } else if (Flayground.FILE.isSubtitles(file)) {
      flay.addSubtitlesFile(file);
    } else if (Flayground.FILE.isImage(file)) {
      flay.addCoverFile(file);
    } else {
      log.warn("unknown file {} -> {}", flay.getOpus(), file);
    }
  }

}
