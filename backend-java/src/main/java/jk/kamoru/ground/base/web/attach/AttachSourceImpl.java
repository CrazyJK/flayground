package jk.kamoru.ground.base.web.attach;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.util.Assert;

import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jakarta.annotation.PostConstruct;
import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.base.web.attach.Attach.Type;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class AttachSourceImpl implements AttachSource {

  @Autowired
  GroundProperties properties;

  private static final String ATTACH = "attach";

  ObjectMapper jsonReader = new ObjectMapper();
  ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

  Map<String, Attach> map = new ConcurrentHashMap<>();
  File attachBasePath;

  @PostConstruct
  void init() throws StreamReadException, DatabindException, IOException {
    log.debug("AttachSource init");
    attachBasePath = properties.getAttachPath();
    Collection<File> listFiles = FileUtils.listFiles(attachBasePath, new String[] { ATTACH }, false);
    log.info(String.format("%5s %-7s - %s", listFiles.size(), ATTACH, attachBasePath));

    for (File file : listFiles) {
      Attach attach = jsonReader.readValue(file, new TypeReference<Attach>() {
      });
      map.put(attach.getId(), attach);
    }
  }

  @Override
  public Attach create(String id, String name, Type type) {
    Assert.state(!map.containsKey(id), "id is duplicated: " + id);

    Attach attach = new Attach(id, name, type, attachBasePath);
    map.put(id, attach);
    return attach;
  }

  @Override
  public Attach get(String id) {
    Attach attach = map.get(id);
    if (attach == null) {
      throw new AttachNotfoundException(id);
    }
    return attach;
  }

  @Override
  public Attach save(Attach attach) {
    final String attachFilename = String.format("%s-%s.%s", attach.getType().name(), attach.getName(), ATTACH);
    File attachFile = new File(attachBasePath, attachFilename);
    try {
      jsonWriter.writeValue(attachFile, attach);
    } catch (IOException e) {
      throw new AttachException("Fail to save attachGroup file ", e);
    }
    return attach;
  }

}
