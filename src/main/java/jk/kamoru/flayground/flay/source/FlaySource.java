package jk.kamoru.flayground.flay.source;

import java.util.Collection;

import jk.kamoru.flayground.flay.domain.Actress;
import jk.kamoru.flayground.flay.domain.Studio;
import jk.kamoru.flayground.flay.domain.Video;

public interface FlaySource {

	void load();
	
	Collection<Video> getVideoList();
	
	Video getVideo(String opus);

	Collection<Studio> getStudioList();
	
	Studio getStudio(String name);
	
	Collection<Actress> getActressList();
	
	Actress getActress(String name);

}
