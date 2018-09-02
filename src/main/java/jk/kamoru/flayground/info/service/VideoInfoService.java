package jk.kamoru.flayground.info.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.info.domain.Video;

@Service
public class VideoInfoService extends InfoServiceAdapter<Video, String> {

	@Autowired FlayService flayService;
	
	@Override
	public void update(Video update) {
		super.update(update);
		Flay flay = flayService.get(update.getOpus());
		flay.setVideo(update);
	}

}
