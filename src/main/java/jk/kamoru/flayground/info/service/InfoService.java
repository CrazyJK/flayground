package jk.kamoru.flayground.info.service;

import java.util.List;

import jk.kamoru.flayground.info.domain.Info;

public interface InfoService<T extends Info<K>, K> {

  T get(K key);

  T getOrNew(K key);

  List<T> list();

  List<T> find(String query);

  T create(T create);

  void update(T update);

  void delete(T delete);

}
