package jk.kamoru.ground.history.source;

import java.io.File;
import java.io.IOException;
import java.text.ParseException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.history.HistoryException;
import jk.kamoru.ground.history.domain.History;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class HistoryRepository {

  @Autowired
  GroundProperties properties;

  List<History> list;

  File getInfoFile() {
    return new File(properties.getInfoPath(), Ground.InfoFilename.HISTORY);
  }

  @PostConstruct
  void load() throws IOException, ParseException {
    list = new CopyOnWriteArrayList<>();
    List<String> lines = FileUtils.readLines(getInfoFile(), Ground.ENCODING);
    boolean first = true;
    for (String line : lines) {
      if (first && line.startsWith(Ground.UTF8_BOM)) {
        line = line.substring(1);
        first = false;
      }
      if (line.trim().length() == 0) {
        continue;
      }

      String[] split = StringUtils.split(line, ",", 4);
      History history = new History();
      if (split.length > 0)
        history.setDate(split[0].trim());
      if (split.length > 1)
        history.setOpus(split[1].trim());
      if (split.length > 2)
        history.setAction(History.Action.valueOf(split[2].trim().toUpperCase()));
      if (split.length > 3)
        history.setDesc(split[3].trim());
      list.add(history);
    }
    log.info(String.format("%5s history - %s", list.size(), getInfoFile()));
  }

  public List<History> list() {
    return list;
  }

  public synchronized void save(History history) {
    list.add(history);
    try {
      FileUtils.writeStringToFile(getInfoFile(), history.toFileSaveString(), Ground.ENCODING, true);
    } catch (IOException e) {
      throw new HistoryException("Fail to save history log");
    }
  }

}
