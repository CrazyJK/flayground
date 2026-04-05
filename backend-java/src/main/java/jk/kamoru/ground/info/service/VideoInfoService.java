package jk.kamoru.ground.info.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.apache.commons.lang3.time.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.ground.flay.FlayNotfoundException;
import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.flay.service.FlayService;
import jk.kamoru.ground.history.domain.History;
import jk.kamoru.ground.history.service.HistoryService;
import jk.kamoru.ground.info.domain.Tag;
import jk.kamoru.ground.info.domain.Video;

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
    long today = new Date().getTime();
    if (video.getLikes() == null || video.getLikes().stream().filter((date) -> (date.getTime() + DateUtils.MILLIS_PER_HOUR * 6) > today).count() == 0) {
      video.addLike();
      this.update(video);
    }
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
