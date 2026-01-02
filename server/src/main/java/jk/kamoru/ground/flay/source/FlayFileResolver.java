package jk.kamoru.ground.flay.source;

import java.io.File;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;

import jk.kamoru.ground.Ground;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FlayFileResolver {

  protected static FlayFileResult resolve(File file) {
    String originalFilename = file.getName();
    String fileName = FilenameUtils.getBaseName(originalFilename);
    String extension = FilenameUtils.getExtension(originalFilename).toLowerCase();
    String[] parts = StringUtils.split(fileName, "]");

    if (parts == null || parts.length < 5) {
      return FlayFileResult.builder().valid(false).build();
    } else {
      String studio = StringUtils.replace(parts[0], "[", "").trim();
      String opus = StringUtils.replace(parts[1], "[", "").trim();
      String title = StringUtils.replace(parts[2], "[", "").trim();
      String actress = StringUtils.replace(parts[3], "[", "").trim();
      String release = StringUtils.replace(parts[4], "[", "").replaceAll("-", ".").replaceAll(",", ".").trim();
      String extra = parts.length > 5 ? parts[5].trim() : "";

      if (studio.length() == 0)
        log.warn("studio pattern is wrong: {}", originalFilename);
      if (opus.length() == 0)
        log.warn("opus pattern is wrong: {}", originalFilename);
      if (title.length() == 0)
        log.warn("title pattern is wrong: {}", originalFilename);
      if (actress.indexOf(".") > -1 || actress.indexOf(",,") > -1)
        log.info("actress pattern is wrong: {}", originalFilename);
      if (!Ground.Format.Date.RELEASE_DATE_PATTERN.matcher(release).matches())
        log.warn("release pattern is wrong: {}", originalFilename);

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

      return FlayFileResult.builder().valid(true).studio(studio).opus(opus).title(title).actress(actress).release(release).file(file).build();
    }
  }

}
