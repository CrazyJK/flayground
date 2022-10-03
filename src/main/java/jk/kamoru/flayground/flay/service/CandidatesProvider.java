package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CandidatesProvider {

  private static final String[] CANDIDATES_FILE_SUFFIXs = ArrayUtils.addAll(Flayground.FILE.VIDEO_SUFFIXs, Flayground.FILE.SUBTITLES_SUFFIXs);

  @Autowired FlayProperties flayProperties;

  public Collection<File> find() {
    Collection<File> candidatesFiles = new ArrayList<>();
    for (File dir : Arrays.asList(flayProperties.getCandidatePath(), flayProperties.getSubtitlesPath())) {
      Collection<File> list = FileUtils.listFiles(dir, CANDIDATES_FILE_SUFFIXs, true);
      log.info(String.format("%5s file    - %s", list.size(), dir));

      candidatesFiles.addAll(list);
    }
    log.info(String.format("%5s candidates", candidatesFiles.size()));
    return candidatesFiles;
  }

  public Collection<Flay> collect(Collection<Flay> flayList) {
    Collection<File> foundCandidates = find();
    return flayList.stream().filter(flay -> matchAndFill(foundCandidates, flay)).collect(Collectors.toList());
  }

  /**
   * add cadidates Movie, Subtitles to flay
   * @param flay
   * @return
   */
  private boolean matchAndFill(Collection<File> candidates, Flay flay) {
    // reset candidates file of flay
    flay.getFiles().get(Flay.CANDI).clear();
    // set keyword
    final String key1 = flay.getOpus().toUpperCase();
    final String key2 = key1.replace("-", "");
    final String key3 = key1.replace("-", "00");

    boolean found = false;
    for (File file : candidates) {
      if (StringUtils.containsAny(file.getName().toUpperCase(), key1, key2, key3)) {
        flay.addCandidatesFile(file);
        found = true;
        log.debug("add candidate {} : {}", flay.getOpus(), file);
      }
    }
    return found;
  }

}
