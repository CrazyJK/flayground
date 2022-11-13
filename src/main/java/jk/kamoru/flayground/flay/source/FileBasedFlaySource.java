package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.PostConstruct;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FileBasedFlaySource implements FlaySource {

  @Autowired FlayFactory flayFactory;

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
  }

  @PostConstruct
  @Override
  public synchronized void load() {
    log.info("[Load {}]", isArchive ? "Archive" : "Instance");

    final Collection<File> listFiles = new ArrayList<>();
    for (File path : paths) {
      if (path.isDirectory()) {
        Collection<File> found = FileUtils.listFiles(path, null, true);
        log.info(String.format("%5s file    - %s", found.size(), path));
        listFiles.addAll(found);
      } else {
        log.warn("Invalid source path {}", path);
      }
    }

    flayMap.clear();;
    for (File file : listFiles) {
      String suffix = FilenameUtils.getExtension(file.getName()).toLowerCase();
      if ("ds_store".contains(suffix)) {
        continue;
      }

      FlayFileResult result = FlayFileResolver.resolve(file);
      if (!result.valid) {
        log.warn(" invalid file - {}", file);
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

    log.info(String.format("%5s Flay", flayMap.size()));
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
