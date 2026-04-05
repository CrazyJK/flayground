package jk.kamoru.ground.image.source;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.base.watch.DirectoryWatcher;
import jk.kamoru.ground.flay.service.FlayFileHandler;
import jk.kamoru.ground.image.ImageNotfoundException;
import jk.kamoru.ground.image.domain.Image;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class LocalImageSource implements ImageSource {

  @Autowired
  GroundProperties properties;
  @Autowired
  FlayFileHandler flayFileHandler;

  private List<Image> imageList;
  private boolean changed = false;

  @PostConstruct
  public void postConstruct() {
    load();
    registWatcher();
  }

  private void registWatcher() {
    Ground.ApplicationReady.add(new DirectoryWatcher(this.getClass().getSimpleName(), properties.getImagePaths()) {

      @Override
      protected void createdFile(File file) {
        changed = Ground.FILE.isImage(file);
      }

      @Override
      protected void deletedFile(File file) {
        changed = Ground.FILE.isImage(file);
      }

      @Override
      protected void modifiedFile(File file) {
        changed = Ground.FILE.isImage(file);
      }

    });
  }

  @CacheEvict(cacheNames = { "bannerCache" }, allEntries = true)
  private synchronized void load() {
    AtomicInteger indexCounter = new AtomicInteger(0);
    imageList = new ArrayList<>();
    for (File dir : properties.getImagePaths()) {
      if (dir.isDirectory()) {
        Collection<File> listFiles = FileUtils.listFiles(dir, null, true);
        log.info(String.format("%5s file    - %s", listFiles.size(), dir));
        for (File file : listFiles) {
          if (Ground.FILE.isImage(file)) {
            imageList.add(indexCounter.get(), new Image(file, indexCounter.getAndIncrement()));
          }
        }
      }
    }
    log.info(String.format("%5s Image", size()));
  }

  @Scheduled(fixedRate = 1000 * 30)
  protected void checkChangedAndReload() {
    if (changed) {
      log.info("Image was changed, Source will be reloaded");
      load();
    }
    changed = false;
  }

  @Override
  public List<Image> list() {
    return imageList;
  }

  @Override
  public int size() {
    return imageList.size();
  }

  @Override
  public Image get(int idx) {
    if (-1 < idx && idx < size())
      return imageList.get(idx);
    else
      throw new ImageNotfoundException(idx);
  }

  @Override
  public void delete(int idx) {
    Image image = get(idx);
    imageList.remove(image);
    flayFileHandler.deleteFile(image.getFile());
  }

}
