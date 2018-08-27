package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FileUtils;

import jk.kamoru.flayground.flay.ActressNotfoundException;
import jk.kamoru.flayground.flay.StudioNotfoundException;
import jk.kamoru.flayground.flay.VideoNotfoundException;
import jk.kamoru.flayground.flay.domain.Actress;
import jk.kamoru.flayground.flay.domain.Studio;
import jk.kamoru.flayground.flay.domain.Video;
import jk.kamoru.flayground.flay.source.FlayFactory.Result;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FileBasedFlaySource implements FlaySource {
	
	private String[] paths;
	
	Map<String, Video> videoMap = new HashMap<>();
	Map<String, Studio> studioMap = new HashMap<>();
	Map<String, Actress> actressMap = new HashMap<>();
	
	
	public FileBasedFlaySource(String...paths) {
		this.paths = paths;
	}
	
	@PostConstruct
	@Override
	public synchronized void load() {
		for (File file : listFiles()) {
			Result result = FlayFactory.parse(file);
			
			if (!result.valid) {
				log.warn("invalid file {}", file);
				continue;
			}
			
			Video video = null;
			if (!videoMap.containsKey(result.getOpus())) {
				video = FlayFactory.newVideo(result);
				videoMap.put(video.getOpus(), video);

				Studio studio = video.getStudio();
				if (!studioMap.containsKey(studio.getName())) {
					studioMap.put(studio.getName(), studio);
				}
				
				for (Actress actress : video.getActressList()) {
					if (!actressMap.containsKey(actress.getName())) {
						actressMap.put(actress.getName(), actress);
					}
				}
			} else {
				video = videoMap.get(result.getOpus());
			}
			
			FlayFactory.addFile(video, file);
		}
	}
	
	private Collection<File> listFiles() {
		Collection<File> found = new ArrayList<>();
		for (String path : paths) {
			File dir = new File(path);
			if (dir.isDirectory()) {
				found.addAll(FileUtils.listFiles(dir, null, true));
			}
			else {
				log.warn("Wrong path {}", dir);
			}
		}
		return found;
	}

	@Override
	public Collection<Video> getVideoList() {
		return videoMap.values();
	}

	@Override
	public Video getVideo(String opus) {
		if (videoMap.containsKey(opus))
			return videoMap.get(opus);
		else
			throw new VideoNotfoundException(opus);
	}

	@Override
	public Collection<Studio> getStudioList() {
		return studioMap.values();
	}

	@Override
	public Studio getStudio(String name) {
		if (studioMap.containsKey(name))
			return studioMap.get(name);
		else
			throw new StudioNotfoundException(name);
	}

	@Override
	public Collection<Actress> getActressList() {
		return actressMap.values();
	}

	@Override
	public Actress getActress(String name) {
		if (actressMap.containsKey(name))
			return actressMap.get(name);
		else
			throw new ActressNotfoundException(name);
	}

}
