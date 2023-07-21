package jk.kamoru.flayground.info.source;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

import org.apache.commons.io.FilenameUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jakarta.annotation.PostConstruct;
import jk.kamoru.flayground.info.InfoException;
import jk.kamoru.flayground.info.domain.Info;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class InfoSourceJsonAdapter<T extends Info<K>, K> extends InfoSourceAdapter<T, K> {

  ObjectMapper jsonReader = new ObjectMapper();
  ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

  /**
   * json 변환 type reference
   *
   * @return
   */
  abstract TypeReference<CopyOnWriteArrayList<T>> getTypeReference();

  void extraInfoLoad() {
  }

  @PostConstruct
  void load() {
    File infoFile = getInfoFile();
    try {
      list = jsonReader.readValue(infoFile, getTypeReference());
      log.info(String.format("%5s %-7s - %s", list.size(), FilenameUtils.getBaseName(infoFile.getName()), getInfoFile()));
      extraInfoLoad();
    } catch (IOException e) {
      throw new InfoException("Fail to load info file " + infoFile, e);
    }
  }

  @Override
  synchronized void save() {
    try {
      jsonWriter.writeValue(getInfoFile(), list);
    } catch (IOException e) {
      throw new InfoException("Fail to save info file " + getInfoFile(), e);
    }
  }

}
