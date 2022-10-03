package jk.kamoru.flayground.info;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.junit.jupiter.api.Test;
import jk.kamoru.flayground.flay.service.FlayFileHandler;

public class V1_file_remover {

  @Test
  void test() {
    String[] paths = new String[] {"J:\\CrazyX", "K:\\CrazyX"};

    Map<String, List<File>> suffixMap = new HashMap<>();
    for (String path : paths) {
      for (File file : FileUtils.listFiles(new File(path), null, true)) {
        String suffix = FilenameUtils.getExtension(file.getName());
        if (suffixMap.containsKey(suffix)) {
          suffixMap.get(suffix).add(file);
        } else {
          List<File> list = new ArrayList<>();
          list.add(file);
          suffixMap.put(suffix, list);
        }
      }
    }

    for (Entry<String, List<File>> entry : suffixMap.entrySet()) {
      System.out.format("%8s = %s%n", entry.getKey(), entry.getValue().size());
    }

    FlayFileHandler flayFileHandler = new FlayFileHandler();

    File dest = new File("J:\\v1file");
    for (Entry<String, List<File>> entry : suffixMap.entrySet()) {
      if ("info,actress,studio".contains(entry.getKey().toLowerCase())) {
        System.out.format("%8s will be delete%n", entry.getKey());
        for (File file : entry.getValue()) {
          // FileUtils.deleteQuietly(file);
          flayFileHandler.moveFileToDirectory(file, dest);
        }
      }
    }

  }

}
