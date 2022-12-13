package jk.kamoru.flayground.diary;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import javax.annotation.PostConstruct;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import jk.kamoru.flayground.FlayProperties;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class DiarySourceImpl implements DiarySource {

  private static final String DIARY = "diary";

  @Autowired FlayProperties flayProperties;

  ObjectMapper jsonReader = new ObjectMapper();
  ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

  Map<String, Diary> diaryMap = new TreeMap<>();

  @PostConstruct
  void load() throws StreamReadException, DatabindException, IOException {
    diaryMap.clear();

    Collection<File> listFiles = FileUtils.listFiles(getDiaryPathFile(), new String[] {DIARY}, false);
    log.info(String.format("%5s %-7s - %s", listFiles.size(), DIARY, getDiaryPathFile()));
    for (File file : listFiles) {
      Diary diary = jsonReader.readValue(file, new TypeReference<Diary>() {});
      diaryMap.put(diary.getDate(), diary);
    }
  }

  private File getDiaryPathFile() {
    return new File(flayProperties.getInfoPath(), DIARY);
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
    diaryMap.put(diary.getDate(), diary);

    try {
      jsonWriter.writeValue(new File(getDiaryPathFile(), diary.getDate() + "." + DIARY), diary);
    } catch (IOException e) {
      throw new IllegalStateException("Fail to save diary file ", e);
    }

    return diary;
  }

}
