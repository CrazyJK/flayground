package jk.kamoru.flayground.flay;

import java.io.File;
import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.flay.source.FileBasedFlaySource;
import jk.kamoru.flayground.flay.source.FlaySource;

@Configuration
public class FlayConfig {

  @Autowired FlayProperties flayProperties;

  @Bean("instanceFlaySource")
  public FlaySource instanceFlaySource() {
    File[] instancePaths = ArrayUtils.addAll(flayProperties.getStagePaths(), flayProperties.getCoverPath(), flayProperties.getStoragePath());
    FlaySource flaySource = new FileBasedFlaySource(instancePaths);
    Flayground.ApplicationReady.add(new Runnable() {
      @Override
      public void run() {
        flaySource.load();
      }
    });
    return flaySource;
  }

  @Bean("archiveFlaySource")
  public FlaySource archiveFlaySource() {
    FlaySource flaySource = new FileBasedFlaySource(true, flayProperties.getArchivePath());
    Flayground.ApplicationReady.add(new Runnable() {
      @Override
      public void run() {
        flaySource.load();
      }
    });
    return flaySource;
  }

}
