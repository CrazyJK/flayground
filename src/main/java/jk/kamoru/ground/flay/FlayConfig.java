package jk.kamoru.ground.flay;

import java.io.File;

import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.flay.source.FileBasedFlaySource;
import jk.kamoru.ground.flay.source.FlaySource;

@Configuration
public class FlayConfig {

  @Autowired
  GroundProperties properties;

  @Bean("instanceFlaySource")
  public FlaySource instanceFlaySource() {
    File[] instancePaths = ArrayUtils.addAll(properties.getStagePaths(), properties.getCoverPath(), properties.getStoragePath());
    FlaySource flaySource = new FileBasedFlaySource(instancePaths);
    Ground.ApplicationReady.add(new Runnable() {
      @Override
      public void run() {
        flaySource.load();
      }
    });
    return flaySource;
  }

  @Bean("archiveFlaySource")
  public FlaySource archiveFlaySource() {
    FlaySource flaySource = new FileBasedFlaySource(true, properties.getArchivePath());
    Ground.ApplicationReady.add(new Runnable() {
      @Override
      public void run() {
        flaySource.load();
      }
    });
    return flaySource;
  }

}
