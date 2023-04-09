package jk.kamoru.flayground.info.service;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.history.domain.History;
import jk.kamoru.flayground.history.service.HistoryService;
import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.domain.Video;

@Service
public class VideoInfoService extends InfoServiceAdapter<Video, String> {

  @Autowired
  FlayService flayService;
  @Autowired
  HistoryService historyService;

  /**
   * 신규 video 저장. 기존에 있는지 찾아보고 동작
   *
   * @param video
   * @return
   */
  public Video put(Video putVideo) {
    Video video = this.infoSource.getOrNew(putVideo.getOpus());
    video.setTitle(putVideo.getTitle());
    video.setDesc(putVideo.getDesc());
    this.update(video);
    return video;
  }

  @Override
  public void update(Video updateVideo) {
    updateVideo.setLastAccess(new Date().getTime());
    try {
      Flay flay = flayService.get(updateVideo.getOpus());
      flay.setVideo(updateVideo);
      historyService.save(History.Action.UPDATE, flay, null);
    } catch (FlayNotfoundException ignore) {
    }
    super.update(updateVideo);
  }

  public void removeTag(Tag deleteTag) {
    List<Video> videoList = new ArrayList<>();
    for (Video video : list()) {
      if (video.getTags().contains(deleteTag)) {
        videoList.add(video);
      }
    }
    for (Video video : videoList) {
      video.getTags().remove(deleteTag);
      update(video);
    }
  }

  public void setRank(String opus, int rank) {
    Video video = this.infoSource.get(opus);
    video.setRank(rank);
    this.update(video);
  }

  public void setLike(String opus) {
    Video video = this.infoSource.get(opus);
    Date today = new Date();
    if (video.getLikes() == null || video.getLikes().stream().filter((date) -> isSameDay(today, date)).count() == 0) {
      video.addLike();
    }
    this.update(video);
  }

  private static boolean isSameDay(Date d1, Date d2) {
    Calendar c1 = Calendar.getInstance();
    c1.setTime(d1);
    Calendar c2 = Calendar.getInstance();
    c2.setTime(d2);
    return c1.get(Calendar.YEAR) == c1.get(Calendar.YEAR) && c1.get(Calendar.MONTH) == c1.get(Calendar.MONTH) && c1.get(Calendar.DAY_OF_MONTH) == c1.get(Calendar.DAY_OF_MONTH);
  }

  public void toggleTag(String opus, Tag tag, boolean checked) {
    Video video = this.infoSource.get(opus);
    if (checked) {
      video.getTags().add(tag);
    } else {
      video.getTags().remove(tag);
    }
    this.update(video);
  }

  public void setComment(String opus, String comment) {
    Video video = this.infoSource.get(opus);
    video.setComment(comment.trim());
    this.update(video);
  }

}
