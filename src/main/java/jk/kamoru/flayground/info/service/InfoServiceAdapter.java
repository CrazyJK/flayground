package jk.kamoru.flayground.info.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jk.kamoru.flayground.base.web.sse.SseEmitters;
import jk.kamoru.flayground.info.domain.Info;
import jk.kamoru.flayground.info.source.InfoSource;

public abstract class InfoServiceAdapter<T extends Info<K>, K> implements InfoService<T, K> {

  @Autowired
  InfoSource<T, K> infoSource;

  @Autowired
  SseEmitters sseEmitters;

  ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

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
    sseEmitters.send(create);
    return created;
  }

  @Override
  public void update(T update) {
    infoSource.update(update);
    sseEmitters.send(update);
  }

  @Override
  public void delete(T delete) {
    infoSource.delete(delete);
    sseEmitters.send(delete);
  }

}
