package jk.kamoru.flayground.diary;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Stream;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jakarta.annotation.PostConstruct;
import jk.kamoru.flayground.FlayException;
import jk.kamoru.flayground.FlayProperties;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class DiarySourceImpl implements DiarySource {

  private static final String DIARY = "diary";

  @Autowired
  FlayProperties flayProperties;

  ObjectMapper jsonReader = new ObjectMapper();
  ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

  Map<String, Diary> diaryMap = new TreeMap<>();

  @PostConstruct
  void load() {
    diaryMap.clear();

    Collection<File> listFiles = FileUtils.listFiles(getDiaryPathFile(), new String[] { DIARY }, false);
    log.info(String.format("%5s %-7s - %s", listFiles.size(), DIARY, getDiaryPathFile()));
    for (File file : listFiles) {
      Diary diary;
      try {
        diary = jsonReader.readValue(file, new TypeReference<Diary>() {
        });
        diaryMap.put(diary.getMeta().getDate(), diary);
      } catch (IOException e) {
        throw new FlayException(String.format("fail to diary read %s : %s", file, e.getMessage()), e);
      }
    }
  }

  private File getDiaryPathFile() {
    return flayProperties.getDiaryPath();
  }

  @Override
  public Set<String> dates() {
    return diaryMap.keySet();
  }

  @Override
  public Collection<Diary> list() {
    return diaryMap.values();
  }

  @Override
  public Diary find(String date) {
    if (!diaryMap.containsKey(date)) {
      throw new RuntimeException("not found " + date);
    }
    return diaryMap.get(date);
  }

  @Override
  public Diary save(Diary diary) {
    diaryMap.put(diary.getMeta().getDate(), diary);

    try {
      File diaryFile = new File(getDiaryPathFile(), diary.getMeta().getDate() + "." + DIARY);

      // backup previous, if exists
      if (diaryFile.exists()) {
        FileUtils.copyFile(diaryFile, getBackupFile(diaryFile));
      }
      // save
      jsonWriter.writeValue(diaryFile, diary);
    } catch (IOException e) {
      throw new IllegalStateException("Fail to save diary file ", e);
    }

    log.info("diary saved {} : {}", diary.getMeta().getDate(), diary.getMeta().getTitle());

    return diary;
  }

  private File getBackupFile(File file) {
    File parentFile = file.getParentFile();
    int maxNumber = Stream.of(parentFile.listFiles())
        .filter(f -> f.getName().startsWith(file.getName()))
        .mapToInt(f -> NumberUtils.toInt(FilenameUtils.getExtension(f.getName())))
        .max()
        .orElse(0);
    return new File(parentFile, file.getName() + "." + ++maxNumber);
  }

}
