package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;

import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlayFactory.Result;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FileBasedFlaySource implements FlaySource {

	@Autowired FlayFactory flayFactory;

	boolean isArchive;

	Map<String, Flay> flayMap;
	private File[] paths;

	public FileBasedFlaySource(File...paths) {
		this(false, paths);
	}

	public FileBasedFlaySource(boolean isArchive, File...paths) {
		this.isArchive = isArchive;
		this.paths = paths;
	}

	@PostConstruct
	@Override
	public synchronized void load() {
		log.info("[load]");

		flayMap = new HashMap<>();
		Collection<File> listFiles = new ArrayList<>();
		for (File dir : paths) {
			if (dir.isDirectory()) {
				Collection<File> found = FileUtils.listFiles(dir, null, true);
				log.info(String.format("%5s file    - %s", found.size(), dir));
				listFiles.addAll(found);
			}
			else {
				log.warn("Invalid source path {}", dir);
			}
		}

		for (File file : listFiles) {
			String suffix = FilenameUtils.getExtension(file.getName()).toLowerCase();
			if ("ds_store".contains(suffix)) {
				continue;
			}

			Result result = flayFactory.parse(file);
			if (!result.valid) {
				log.warn(" invalid file - {}", file);
				continue;
			}

			Flay flay = null;
			if (!flayMap.containsKey(result.getOpus())) {
				flay = flayFactory.newFlay(result);
				flay.setArchive(isArchive);
				flayMap.put(flay.getOpus(), flay);
			} else {
				flay = flayMap.get(result.getOpus());
			}

			flayFactory.addFile(flay, file);
		}
		log.info(String.format("%5s Flay", flayMap.size()));
	}

	@Override
	public Collection<Flay> list() {
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
