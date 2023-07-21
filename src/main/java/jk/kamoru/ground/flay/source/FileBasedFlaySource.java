package jk.kamoru.ground.flay.source;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;

import jk.kamoru.ground.base.web.sse.LogAndSse;
import jk.kamoru.ground.flay.FlayNotfoundException;
import jk.kamoru.ground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FileBasedFlaySource extends LogAndSse implements FlaySource {

  @Autowired
  FlayFactory flayFactory;

  private boolean isArchive;
  private File[] paths;
  private Map<String, Flay> flayMap;

  public FileBasedFlaySource(File... paths) {
    this(false, paths);
  }

  public FileBasedFlaySource(boolean isArchive, File... paths) {
    this.isArchive = isArchive;
    this.paths = paths;
    this.flayMap = new HashMap<>();
    log.debug("FlaySource.<init> {}", isArchive ? "Archive" : "Instance");
  }

  @Override
  public synchronized void load() {
    final String LOAD = "[Load " + (isArchive ? "Archive" : "Instance") + "]";

    final Collection<File> listFiles = new ArrayList<>();
    for (File path : paths) {
      if (path.isDirectory()) {
        Collection<File> found = FileUtils.listFiles(path, null, true);
        batchLogger(String.format("%-15s %5s file - %s", LOAD, found.size(), path));
        listFiles.addAll(found);
      } else {
        log.warn("Invalid source path {}", path);
      }
    }

    flayMap.clear();
    ;
    for (File file : listFiles) {
      String suffix = FilenameUtils.getExtension(file.getName()).toLowerCase();
      if ("ds_store".contains(suffix)) {
        continue;
      }

      FlayFileResult result = FlayFileResolver.resolve(file);
      if (!result.valid) {
        log.warn(String.format("%-15s invalid file - %s", LOAD, file));
        continue;
      }

      Flay flay = null;
      try {
        flay = get(result.opus);
      } catch (FlayNotfoundException e) {
        flay = flayFactory.newFlay(result, isArchive);
        flayMap.put(flay.getOpus(), flay);
      }

      flayFactory.addFile(flay, result.file);
    }

    batchLogger(String.format("%-15s %5s Flay", LOAD, flayMap.size()));
  }

  @Override
  public Collection<Flay> list() {
    return flayMap.values();
  }

  @Override
  public Flay get(String opus) {
    if (flayMap.containsKey(opus))
      return flayMap.get(opus);
    else
      throw new FlayNotfoundException(opus);
  }

}
