package jk.kamoru.flayground.todayis.service;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.apache.commons.io.FileUtils;
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
		for (File path : flayProperties.getTodayisPaths()) {
			Collection<File> listFiles = FileUtils.listFiles(path, null, true);
			for (File file : listFiles) {
				if (Flayground.FILE.isVideo(file)) {
					list.add(new Todayis(file));
				}
			}
		}
		return list;
	}

	@Override
	public void play(Todayis todayis) {
		List<String> commands = new ArrayList<>();
		commands.add(flayProperties.getPlayerApp().toString());
		commands.add(todayis.getFilePath());
		flayActionHandler.exec(commands);
	}

	@Override
	public void delete(Todayis todayis) {
		FileUtils.deleteQuietly(new File(todayis.getFilePath()));
		log.info("delete", todayis);
	}

}
