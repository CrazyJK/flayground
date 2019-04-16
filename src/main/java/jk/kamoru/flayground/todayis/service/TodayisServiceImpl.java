package jk.kamoru.flayground.todayis.service;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.flay.service.FlayActionHandler;
import jk.kamoru.flayground.todayis.domain.Todayis;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class TodayisServiceImpl implements TodayisService {

	@Autowired FlayProperties flayProperties;

	@Autowired FlayActionHandler flayActionHandler;

	List<Todayis> list;

	@Override
	public Collection<Todayis> list() {
		list = new ArrayList<>();
		for (String path : flayProperties.getTodayisPaths()) {
			Collection<File> listFiles = FileUtils.listFiles(new File(path), null, true);
			for (File file : listFiles) {
				if (Flayground.FILE.isVideo(file)) {
					list.add(new Todayis(file));
				}
			}
		}
		return list.stream().sorted((a, b) -> {
			int compareTo = b.getPath().compareToIgnoreCase(a.getPath());
			if (compareTo == 0) {
//				return a.getName().compareToIgnoreCase(b.getName());
				return NumberUtils.compare(a.getLastModified(), b.getLastModified());
			} else {
				return compareTo;
			}
		}).collect(Collectors.toList());
	}

	@Override
	public void play(Todayis todayis) {
		List<String> commands = new ArrayList<>();
		commands.add(flayProperties.getPlayerApp());
		commands.add(todayis.getFilePath());
		flayActionHandler.exec(commands);
	}

	@Override
	public void delete(Todayis todayis) {
		FileUtils.deleteQuietly(new File(todayis.getFilePath()));
		log.info("delete", todayis);
	}

}
