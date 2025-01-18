package jk.kamoru.ground.memo;

import java.io.File;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.flay.FlayException;

@Service
public class MemoServiceImpl implements MemoService {

  private static final String MEMO_FILENAME = "memo.data";

  ObjectMapper jsonReader = new ObjectMapper();
  ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

  @Autowired
  GroundProperties properties;

  @Override
  public Memo read() {
    try {
      return jsonReader.readValue(getFile(), Memo.class);
    } catch (IOException e) {
      return new Memo();
    }
  }

  @Override
  public Memo write(Memo memo) {
    try {
      File file = getFile();
      if (!file.exists())
        file.createNewFile();
      jsonWriter.writeValue(file, memo);
      memo.setHtml("");
      return memo;
    } catch (IOException e) {
      throw new FlayException("fail to write memo", e);
    }
  }

  private File getFile() {
    return new File(properties.getInfoPath(), MEMO_FILENAME);
  }
}
