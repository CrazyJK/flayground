package jk.kamoru.ground.todayis.service;

import java.io.File;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.flay.service.FlayAsyncExecutor;
import jk.kamoru.ground.todayis.TodayisException;
import jk.kamoru.ground.todayis.domain.Todayis;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class TodayisServiceImpl implements TodayisService {

  @Autowired
  FlayAsyncExecutor flayAsyncExecutor;

  @Autowired
  GroundProperties properties;

  private Map<String, Todayis> map;

  @Override
  public Collection<Todayis> list() {
    map = new HashMap<>();
    for (File path : properties.getTodayisPaths()) {
      Collection<File> listFiles = FileUtils.listFiles(path, null, true);
      for (File file : listFiles) {
        if (Ground.FILE.isVideo(file)) {
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
      throw new TodayisException("data is null or empty");
    }
    return map.get(uuid);
  }

  @Override
  public void play(Todayis todayis) {
    flayAsyncExecutor.exec(properties.getPlayerApp(), todayis.getFilePath());
  }

  @Override
  public void delete(Todayis todayis) {
    FileUtils.deleteQuietly(new File(todayis.getFilePath()));
    log.info("delete", todayis);
  }

}
