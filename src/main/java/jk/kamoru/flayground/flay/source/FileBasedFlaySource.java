package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;

import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlayFactory.Result;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FileBasedFlaySource implements FlaySource {
	
	@Autowired FlayFactory flayFactory;
	
	Map<String, Flay> flayMap;
	private String[] paths;
	
	public FileBasedFlaySource(String...paths) {
		this.paths = paths;
	}
	
	@PostConstruct
	@Override
	public synchronized void load() {
		
		flayMap = new HashMap<>();
		
		for (File file : listFiles()) {
			Result result = flayFactory.parse(file);
			
			if (!result.valid) {
				log.warn("invalid file {}", file);
				continue;
			}
			
			Flay flay = null;
			if (!flayMap.containsKey(result.getOpus())) {
				flay = flayFactory.newFlay(result);
				flayMap.put(flay.getOpus(), flay);
			} else {
				flay = flayMap.get(result.getOpus());
			}
			
			flayFactory.addFile(flay, file);
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
				log.warn("Wrong source path {}", dir);
			}
		}
		return found;
	}

	@Override
	public Collection<Flay> getList() {
		return flayMap.values();
	}

	@Override
	public Flay get(String opus) {
		if (flayMap.containsKey(opus))
			return flayMap.get(opus);
		else
			throw new FlayNotfoundException(opus);
	}

}
