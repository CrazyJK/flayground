package jk.kamoru.flayground.diary;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Stream;
import javax.annotation.PostConstruct;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import jk.kamoru.flayground.FlayException;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.base.web.attach.Attach;
import jk.kamoru.flayground.base.web.attach.AttachPocket;
import jk.kamoru.flayground.base.web.socket.topic.message.TopicMessageService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class DiarySourceImpl implements DiarySource {

  private static final String DIARY = "diary";
  private static final String ATTACH = "attach";

  @Autowired FlayProperties flayProperties;

  @Autowired AttachPocket attachPocket;

  @Autowired TopicMessageService topicMessageService;

  ObjectMapper jsonReader = new ObjectMapper();
  ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

  Map<String, Diary> diaryMap = new TreeMap<>();

  @PostConstruct
  void load() {
    diaryMap.clear();

    Collection<File> listFiles = FileUtils.listFiles(getDiaryPathFile(), new String[] {DIARY}, false);
    log.info(String.format("%5s %-7s - %s", listFiles.size(), DIARY, getDiaryPathFile()));
    for (File file : listFiles) {
      Diary diary;
      try {
        diary = jsonReader.readValue(file, new TypeReference<Diary>() {});
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

    if (diary.getAddedAttachUniqueKeys() != null) {
      int lastCount = getLastFileNumber(diary);

      for (String uniqueKey : diary.getAddedAttachUniqueKeys()) {
        Attach attach = attachPocket.out(uniqueKey);
        File destFile = new File(getDiaryPathFile(), diary.getMeta().getDate() + "." + ATTACH + "." + ++lastCount);
        try {
          FileUtils.copyFile(attach.getFile(), destFile);
          attach.close();
        } catch (IOException e) {
          throw new IllegalStateException("Fail to copy file ", e);
        }
        diary.addAttach(new Diary.Attach(destFile, attach.getOriginalFilename(), attach.getContentType(), attach.getSize()));
      }
      diary.resetAddedAttachUniqueKeys();
    }

    File diaryFile = new File(getDiaryPathFile(), diary.getMeta().getDate() + "." + DIARY);
    try {
      // backup previous
      FileUtils.copyFile(diaryFile, getBackupFile(diaryFile));
      // save
      jsonWriter.writeValue(diaryFile, diary);
    } catch (IOException e) {
      throw new IllegalStateException("Fail to save diary file ", e);
    }

    topicMessageService.sendFromServerToCurrentUser("DIARY", "saved " + diary.getMeta().getDate());
    log.info("diary saved {} : {}", diary.getMeta().getDate(), diary.getMeta().getTitle());

    return diary;
  }

  private File getBackupFile(File file) {
    File parentFile = file.getParentFile();
    int maxNumber = Stream.of(parentFile.listFiles()).filter(f -> f.getName().startsWith(file.getName())).mapToInt(f -> NumberUtils.toInt(FilenameUtils.getExtension(f.getName()))).max().orElse(0);
    return new File(parentFile, file.getName() + "." + ++maxNumber);
  }

  private int getLastFileNumber(Diary diary) {
    if (diary.getAttachs() == null || diary.getAttachs().size() == 0) {
      return 0;
    } else {
      return diary.getAttachs().stream().mapToInt((attach) -> NumberUtils.toInt(FilenameUtils.getExtension(attach.getFile().getName()))).max().orElse(0);
    }
  }

}
