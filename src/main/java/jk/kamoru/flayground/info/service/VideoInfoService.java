package jk.kamoru.flayground.info.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.domain.Video;

@Service
public class VideoInfoService extends InfoServiceAdapter<Video, String> {

	@Autowired FlayService flayService;
	
	@Override
	public void update(Video update) {
		Flay flay = flayService.get(update.getOpus());
		update.setLastAccess(new Date().getTime());
		flay.setVideo(update);
		super.update(update);
	}

	public void removeTag(Tag delete) {
		List<Video> videoList = new ArrayList<>();
		for (Video video : list()) {
			if (video.getTags().contains(delete.getId())) {
				videoList.add(video);
			}
		}
		for (Video video : videoList) {
			video.getTags().remove(delete.getId());
			update(video);
		}
	}

}
