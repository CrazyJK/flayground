package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Video;
import jk.kamoru.flayground.flay.source.FlaySource;

@Service
public class VideoService implements FlayService<Video> {

	@Autowired FlaySource instanceFlaySource;
	
	@Override
	public Collection<Video> getList(Search search) {
		return instanceFlaySource.getVideoList().stream().filter(v -> {
			return search.contains(v);
		}).collect(Collectors.toList());
	}

	@Override
	public Video get(String opus) {
		return instanceFlaySource.getVideo(opus);
	}

}
