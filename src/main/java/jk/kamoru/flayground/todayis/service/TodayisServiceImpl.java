package jk.kamoru.flayground.todayis.service;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

  private Map<String, Todayis> map;

  @Override
  public Collection<Todayis> list() {
    map = new HashMap<>();
    for (File path : flayProperties.getTodayisPaths()) {
      Collection<File> listFiles = FileUtils.listFiles(path, null, true);
      for (File file : listFiles) {
        if (Flayground.FILE.isVideo(file)) {
          Todayis instance = Todayis.toInstance(file);
          map.put(instance.getUuid(), instance);
        }
      }
    }
    return map.values();
  }

  @Override
  public Todayis get(String uuid) {
    if (map == null || map.isEmpty()) {
      throw new IllegalStateException("data is null or empty");
    }
    return map.get(uuid);
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
