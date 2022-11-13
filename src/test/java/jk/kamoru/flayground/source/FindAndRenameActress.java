package jk.kamoru.flayground.source;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FindAndRenameActress {

  // Studio,Opus,Title,Actress,Released,Rank,Fullname
  static final File referenceFolder = new File("D:/kAmOrU/flayOn/flayground-archive");
  static final File historyFile = new File("K:/Crazy/Info/history.csv");
  static final File[] paths = new File[] {new File("J:/Crazy/Stage"), new File("K:/Crazy/Stage"), new File("K:/Crazy/Cover"), new File("K:/Crazy/Storage"), new File("K:/Crazy/Archive")};

  public static void main(String[] args) throws IOException {
    Map<String, String> opusActressMap = new HashMap<>();

    opusActressMap.put("FSDSS-512", "Amatsuka Moe");
    opusActressMap.put("IPX-955", "Kijima Airi");
    opusActressMap.put("IPX-956", "Aizawa Minami");
    opusActressMap.put("IPX-970", "Nishimiya Yume");
    opusActressMap.put("SSIS-549", "Tsubasa Mai");
    opusActressMap.put("SSIS-571", "Okuda Saki");
    opusActressMap.put("SSIS-578", "Shinonome Mirei");



    Collection<File> foundReferenceFiles = FileUtils.listFiles(referenceFolder, null, true);
    for (File file : foundReferenceFiles) {
      Result result = resolveFlay(file);
      if (!opusActressMap.containsKey(result.opus)) {
        opusActressMap.put(result.opus, result.actress);
      }
    }
    log.debug("foundReferenceFiles " + foundReferenceFiles.size());

    List<String> readHistories = FileUtils.readLines(historyFile, "utf-8");
    for (String historyStr : readHistories) {
      String[] split = StringUtils.split(historyStr, ",", 4);
      History history = new History();
      if (split.length > 0)
        history.setDate(split[0].trim());
      if (split.length > 1)
        history.setOpus(split[1].trim());
      if (split.length > 2)
        history.setAction(split[2].trim().toUpperCase());
      if (split.length > 3)
        history.setDesc(split[3].trim());

      if ("PLAY".equals(history.getAction())) {
        if (!opusActressMap.containsKey(history.opus)) {
          String actress = findActress(history.getDesc());
          if (StringUtils.isNotBlank(actress)) {
            opusActressMap.put(history.opus, actress);
          }
        }
      }
    }

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
    log.debug("listFiles " + listFiles.size());

    int count = 0;
    for (File file : listFiles) {
      Result result = resolveFlay(file);
      if (!result.valid) {
        log.warn(" invalid file - {}", file);
        continue;
      }

      if (opusActressMap.containsKey(result.opus)) {
        String actress = opusActressMap.get(result.opus);
        if (!actress.equals(result.actress)) {
          final String normalizedFilename = String.format("[%s][%s][%s][%s][%s]%s.%s", result.studio, result.opus, result.title, actress, result.release, result.extra, result.ext);
          File destFile = new File(file.getParentFile(), normalizedFilename);
          log.debug("{} destFile {}", ++count, destFile);
          file.renameTo(destFile);
        }
      } else {
        log.debug("{} file {}", ++count, file);
      }


    }
  }


  private static String findActress(String desc) {
    String[] parts = StringUtils.split(desc, "]");
    if (parts == null || parts.length < 5) {
      return null;
    } else {
      return StringUtils.replace(parts[3], "[", "").trim();
    }
  }

  static Result resolveFlay(File file) {
    String originalFilename = file.getName();
    String fileName = FilenameUtils.getBaseName(originalFilename);
    String extension = FilenameUtils.getExtension(originalFilename).toLowerCase();
    String[] parts = StringUtils.split(fileName, "]");

    if (parts == null || parts.length < 5) {
      return Result.builder().valid(false).build();
    } else {
      String studio = StringUtils.replace(parts[0], "[", "").trim();
      String opus = StringUtils.replace(parts[1], "[", "").trim();
      String title = StringUtils.replace(parts[2], "[", "").trim();
      String actress = StringUtils.replace(parts[3], "[", "").trim();
      String release = StringUtils.replace(parts[4], "[", "").replaceAll("-", ".").replaceAll(",", ".").trim();
      String extra = parts.length > 5 ? parts[5].trim() : "";

      // temp find actress

      // file rename if
      final String normalizedFilename = String.format("[%s][%s][%s][%s][%s]%s.%s", studio, opus, title, actress, release, extra, extension);
      if (!StringUtils.equals(originalFilename, normalizedFilename)) {
        File destFile = new File(file.getParentFile(), normalizedFilename);
        if (file.renameTo(destFile)) {
          file = destFile;
          log.info("rename: {} => {}", file, destFile);
        } else {
          log.error("rename failed. {} => {}", file, destFile);
        }
      }

      return Result.builder().valid(true).studio(studio).opus(opus).title(title).actress(actress).release(release).extra(extra).ext(extension).file(file).build();
    }
  }

}


@Builder
class Result {
  boolean valid;
  String studio;
  String opus;
  String title;
  String actress;
  String release;
  String extra;
  String ext;
  File file;
}


@Data
class History {
  String date;
  String opus;
  String action;
  String desc;
}
