package jk.kamoru.flayground.info.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.domain.Video;

@Service
public class VideoInfoService extends InfoServiceAdapter<Video, String> {

	@Autowired FlayService flayService;

	@Override
	public void update(Video updateVideo) {
		updateVideo.setLastAccess(new Date().getTime());
		try {
			Flay flay = flayService.get(updateVideo.getOpus());
			flay.setVideo(updateVideo);
		} catch (FlayNotfoundException ignore) {
		}
		super.update(updateVideo);
	}

	public void removeTag(Tag deleteTag) {
		List<Video> videoList = new ArrayList<>();
		for (Video video : list()) {
			if (video.getTags().contains(deleteTag.getId())) {
				videoList.add(video);
			}
		}
		for (Video video : videoList) {
			video.getTags().remove(deleteTag.getId());
			update(video);
		}
	}

}
