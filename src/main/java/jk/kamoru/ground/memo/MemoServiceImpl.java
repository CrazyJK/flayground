package jk.kamoru.ground.memo;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.flay.FlayException;

@Service
public class MemoServiceImpl implements MemoService {

  private static final String MEMO_FILENAME = "memo.html";

  @Autowired
  GroundProperties properties;

  @Override
  public Memo read() {
    try {
      File file = getFile();
      if (!file.exists())
        file.createNewFile();
      String html = Files.readString(file.toPath(), StandardCharsets.UTF_8);
      return new Memo(html, file.lastModified(), file.length());
    } catch (IOException e) {
      throw new FlayException("fail to read memo", e);
    }
  }

  @Override
  public Memo write(String html) {
    try {
      File file = getFile();
      Files.writeString(file.toPath(), html, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
      return new Memo("", file.lastModified(), file.length());
    } catch (IOException e) {
      throw new FlayException("fail to write memo", e);
    }
  }

  private File getFile() {
    return new File(properties.getInfoPath(), MEMO_FILENAME);
  }
}
