package jk.kamoru.flayground.info.source;

import java.io.File;
import java.io.IOException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import jk.kamoru.flayground.FlayConfig;
import jk.kamoru.flayground.info.domain.History;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class HistoryRepository {

	@Value("${path.info}") String infoPath;

	List<History> list;
	long id = 0;
	
	File getInfoFile() {
		return new File(infoPath, FlayConfig.HISTORY_FILE_NAME);
	}

	@PostConstruct
	void load() throws IOException, ParseException {
		list = new ArrayList<>();
		List<String> lines = FileUtils.readLines(getInfoFile(), FlayConfig.ENCODING);
		for (String line : lines) {
			if (line.trim().length() == 0) {
				continue;
			}
			
			String[] split = StringUtils.split(line, ",", 4);
			History history = new History();
			history.setId(id++);
			if (split.length > 0)
				history.setDate(split[0].trim());
			if (split.length > 1)
				history.setOpus(split[1].trim());
			if (split.length > 2)
				history.setAction(History.Action.valueOf(split[2].trim().toUpperCase()));
			if (split.length > 3)
				history.setDesc(StringUtils.substringBetween(split[3], "\"", "\""));
			list.add(history);
		}
		log.info(String.format("%5s history - %s", list.size(), getInfoFile()));
	}

	synchronized void save(History history) {
		history.setId(id++);
		history.setDate(FlayConfig.DateTimeFormat.format(new Date()));
		list.add(history);
		try {
			FileUtils.writeStringToFile(getInfoFile(), history.toFileSaveString(), FlayConfig.ENCODING, true);
		} catch (IOException e) {
			throw new IllegalStateException("Fail to save history log");
		}
	}

	public List<History> list() {
		return list;
	}

	public History get(Long id) {
		return list.get(id.intValue());
	}

	public History create(History create) {
		save(create);
		return create;
	}

}
