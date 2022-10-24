package jk.kamoru.flayground.info.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import jk.kamoru.flayground.base.web.socket.notice.AnnounceService;
import jk.kamoru.flayground.info.domain.Info;
import jk.kamoru.flayground.info.source.InfoSource;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class InfoServiceAdapter<T extends Info<K>, K> implements InfoService<T, K> {

  ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

  @Autowired InfoSource<T, K> infoSource;
  @Autowired AnnounceService notificationService;

  @Override
  public T get(K key) {
    return infoSource.get(key);
  }

  @Override
  public T getOrNew(K key) {
    return infoSource.getOrNew(key);
  }

  @Override
  public List<T> list() {
    return infoSource.list();
  }

  @Override
  public List<T> find(String query) {
    return infoSource.list().stream().filter(t -> {
      return t.toString().contains(query);
    }).toList();
  }

  @Override
  public T create(T create) {
    T created = infoSource.create(create);
    try {
      notificationService.announceTo("Created", jsonWriter.writeValueAsString(created));
    } catch (JsonProcessingException e) {
      log.error(e.getMessage());
    }
    return created;
  }

  @Override
  public void update(T update) {
    infoSource.update(update);
    try {
      notificationService.announceTo("Updated", jsonWriter.writeValueAsString(update));
    } catch (JsonProcessingException e) {
      log.error(e.getMessage());
    }
  }

  @Override
  public void delete(T delete) {
    infoSource.delete(delete);
    try {
      notificationService.announceTo("Deleted", jsonWriter.writeValueAsString(delete));
    } catch (JsonProcessingException e) {
      log.error(e.getMessage());
    }
  }

}
