package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map.Entry;
import java.util.Set;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.base.advice.TrackExecutionTime;
import jk.kamoru.flayground.base.web.socket.notice.AnnounceService;
import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;
import jk.kamoru.flayground.history.domain.History;
import jk.kamoru.flayground.history.service.HistoryService;
import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.source.InfoSource;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FlayServiceImpl extends FlayServiceAdapter implements FlayService {

  @Autowired FlayProperties flayProperties;

  @Autowired FlaySource instanceFlaySource;
  @Autowired FlaySource archiveFlaySource;
  @Autowired InfoSource<Video, String> videoInfoSource;
  @Autowired InfoSource<Tag, Integer> tagInfoSource;

  @Autowired HistoryService historyService;
  @Autowired FlayActionHandler flayActionHandler;
  @Autowired FlayFileHandler flayFileHandler;
  @Autowired CandidatesProvider candidatesProvider;
  @Autowired AnnounceService notificationService;
  @Autowired ScoreCalculator scoreCalculator;

  @Override
  public Flay get(String key) {
    return instanceFlaySource.get(key);
  }

  @Override
  public Page<Flay> page(Pageable pageable, String keyword) {
    return page(instanceFlaySource.list(), pageable, keyword);
  }

  @Override
  public Collection<Flay> list() {
    return instanceFlaySource.list();
  }

  @Override
  public Collection<Flay> listOrderbyScoreDesc() {
    return scoreCalculator.listOrderByScoreDesc(instanceFlaySource.list());
  }

  @Override
  public Collection<Flay> listOfLowScore() {
    final long storageLimit = flayProperties.getStorageLimit() * FileUtils.ONE_GB;
    List<Flay> lowScoreList = new ArrayList<>();
    long lengthSum = 0;
    for (Flay flay : scoreCalculator.listOrderByScoreDesc(instanceFlaySource.list())) {
      lengthSum += flay.getLength();
      if (lengthSum > storageLimit) {
        lowScoreList.add(flay);
      }
    }
    return lowScoreList;
  }

  @Override
  public Collection<Flay> find(Search search) {
    return findBySearch(instanceFlaySource.list(), search);
  }

  @Override
  public Collection<Flay> find(String query) {
    return findByQuery(instanceFlaySource.list(), query);
  }

  @TrackExecutionTime(level = TrackExecutionTime.LEVEL.DEBUG)
  @Override
  public Collection<Flay> find(String field, String value) {
    return findByField(instanceFlaySource.list(), field, value);
  }

  @Override
  public Collection<Flay> findByTagLike(Integer id) {
    Tag tag = tagInfoSource.get(id);
    return instanceFlaySource.list().stream().filter(f -> {
      final String[] split = StringUtils.split(tag.getName() + "," + tag.getDescription(), ",");
      final String[] searchChars = List.of(split).stream().map(s -> s.trim()).toArray(String[]::new);
      return f.getVideo().getTags().stream().anyMatch(t -> t.getId().equals(id)) || StringUtils.containsAny(f.getFullname(), searchChars);
    }).toList();
  }

  @Override
  public Collection<Flay> findCandidates() {
    return candidatesProvider.collect(instanceFlaySource.list());
  }

  @Override
  public void acceptCandidates(String opus) {
    Flay flay = instanceFlaySource.get(opus);
    List<File> candiList = flay.getFiles().get(Flay.CANDI);
    List<File> movieList = flay.getFiles().get(Flay.MOVIE);
    List<File> subtiList = flay.getFiles().get(Flay.SUBTI);

    File stagePath = flayProperties.getStagePaths()[0];
    for (File file : candiList) {
      String filename = file.getName();
      // 파일 종류에 따라 이동 위치 조정
      if (Flayground.FILE.isVideo(file)) {
        flayFileHandler.moveFileToDirectory(file, stagePath);
        movieList.add(new File(stagePath, filename));
      } else if (Flayground.FILE.isSubtitles(file)) {
        // 비디오 파일이 있으면, 그 위치로 이동
        File baseFolder = movieList.size() > 0 ? movieList.get(0).getParentFile() : stagePath;
        flayFileHandler.moveFileToDirectory(file, baseFolder);
        subtiList.add(new File(baseFolder, filename));
      } else {
        throw new IllegalStateException("file is not known suffix. " + file);
      }
    }
    candiList.clear();
    // Rank 조정
    if (flay.getVideo().getRank() < 0) {
      flay.getVideo().setRank(0);
    }
    // 전체 파일명 조정
    flayFileHandler.rename(flay);
    notificationService.announceTo("Accept candidates", flay.getFullname());
  }

  @Override
  public void play(String opus) {
    Flay flay = instanceFlaySource.get(opus);
    flayActionHandler.play(flay);

    flay.getVideo().increasePlayCount();

    videoInfoSource.update(flay.getVideo());
    historyService.save(History.Action.PLAY, flay, null);
  }

  @Override
  public void edit(String opus) {
    flayActionHandler.edit(instanceFlaySource.get(opus));
  }

  @Override
  public void rename(String opus, Flay newFlay) {
    log.info("rename {}, {}", opus, newFlay.getFullname());
    if (!opus.equals(newFlay.getOpus())) {
      throw new IllegalArgumentException("Not allowed to change opus");
    }
    Flay flay = null;
    try {
      flay = instanceFlaySource.get(opus);
    } catch (FlayNotfoundException e) {
      flay = archiveFlaySource.get(opus);
    }
    flayFileHandler.rename(flay, newFlay.getStudio(), newFlay.getTitle(), newFlay.getActressList(), newFlay.getRelease());
    notificationService.announceTo("Rename Flay", newFlay.getFullname());
  }

  @Override
  public void openFolder(String folder) {
    flayActionHandler.openFolder(folder);
  }

  @Override
  public void deleteFile(String file) {
    flayFileHandler.deleteFile(new File(file));
    log.warn("delete file {}", file);
  }

  @Override
  public void deleteFileOnFlay(String opus, String file) {
    // remove in Flay
    File deletedFile = new File(file);
    Flay flay = instanceFlaySource.get(opus);
    Set<Entry<String, List<File>>> entrySet = flay.getFiles().entrySet();
    for (Entry<String, List<File>> entry : entrySet) {
      List<File> fileList = entry.getValue();
      if (fileList.contains(deletedFile)) {
        fileList.remove(deletedFile);
      }
    }
    // delete
    deleteFile(file);
    // rename for assemble
    flayFileHandler.rename(flay);
  }

}
