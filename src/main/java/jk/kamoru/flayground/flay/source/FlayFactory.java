package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.io.FilenameUtils;
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
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FlayFactory {

  @Autowired InfoSource<Video, String> videoInfoSource;
  @Autowired InfoSource<Studio, String> studioInfoSource;
  @Autowired InfoSource<Actress, String> actressInfoSource;

  @Autowired HistoryService historyService;

  @Data
  public static class Result {
    boolean valid;
    String studio;
    String opus;
    String title;
    String actress;
    String release;
    File file;
  }

  public Result parse(File file) {
    final String originalFilename = file.getName();

    String baseName = FilenameUtils.getBaseName(originalFilename);
    String extension = FilenameUtils.getExtension(originalFilename);

    String[] parts = StringUtils.split(baseName, "]");
    Result result = new Result();
    if (parts == null || parts.length < 5) {
      result.valid = false;
    } else {
      result.valid = true;
      result.studio = StringUtils.replace(parts[0], "[", "").trim();
      result.opus = StringUtils.replace(parts[1], "[", "").trim();
      result.title = StringUtils.replace(parts[2], "[", "").trim();
      result.actress = StringUtils.replace(parts[3], "[", "").trim();
      result.release = StringUtils.replace(parts[4], "[", "").trim();
      result.file = file;

      if (result.studio.length() == 0) {
        log.info("studio pattern is wrong: {}", originalFilename);
      }
      if (result.opus.length() == 0) {
        log.info("opus pattern is wrong: {}", originalFilename);
      }
      if (result.title.length() == 0) {
        log.info("title pattern is wrong: {}", originalFilename);
      }
      if (result.actress.indexOf(".") > -1) {
        log.info("actress pattern is wrong: {}", originalFilename);
      }
      if (!Flayground.Format.Date.RELEASE_DATE_PATTERN.matcher(result.release).matches()) {
        log.info("release pattern is wrong: {}", originalFilename);
      }

      String normalizedFilename = String.format("[%s][%s][%s][%s][%s]", result.studio, result.opus, result.title, result.actress, result.release.replaceAll("-", ".").replaceAll(",", "."));
      if (parts.length == 6) {
        normalizedFilename += parts[5];
      }
      normalizedFilename += "." + extension.toLowerCase();
      if (!StringUtils.equals(originalFilename, normalizedFilename)) {
        File destFile = new File(file.getParentFile(), normalizedFilename);
        if (file.renameTo(destFile)) {
          result.file = destFile;
        }
        log.info("rename: {} => {}", file, destFile);
      }
    }
    return result;
  }

  public Flay newFlay(Result result, boolean isArchive) {
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

  private List<String> getActressList(String actress) {
    List<String> list = new ArrayList<>();
    for (String name : StringUtils.split(actress, ",")) {
      String onePerson = String.join(" ", StringUtils.split(name));
      String actressName = actressInfoSource.getOrNew(onePerson).getName();
      list.add(actressName);
    }
    return list;
  }

  public void addFile(Flay flay, File file) {
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
