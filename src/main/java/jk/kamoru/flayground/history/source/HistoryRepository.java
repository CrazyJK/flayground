package jk.kamoru.flayground.history.source;

import java.io.File;
import java.io.IOException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.PostConstruct;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.history.domain.History;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class HistoryRepository {

  @Autowired FlayProperties flayProperties;

  List<History> list;

  File getInfoFile() {
    return new File(flayProperties.getInfoPath(), Flayground.InfoFilename.HISTORY);
  }

  @PostConstruct
  void load() throws IOException, ParseException {
    list = new ArrayList<>();
    List<String> lines = FileUtils.readLines(getInfoFile(), Flayground.ENCODING);
    boolean first = true;
    for (String line : lines) {
      if (first && line.startsWith(Flayground.UTF8_BOM)) {
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
      FileUtils.writeStringToFile(getInfoFile(), history.toFileSaveString(), Flayground.ENCODING, true);
    } catch (IOException e) {
      throw new IllegalStateException("Fail to save history log");
    }
  }

}
