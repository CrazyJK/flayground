package jk.kamoru.ground.info.source;

import java.util.List;

import jk.kamoru.ground.info.domain.Info;

public interface InfoSource<T extends Info<K>, K> {

  List<T> list();

  T get(K key);

  T getOrNew(K key);

  T create(T createT);

  void update(T updateT);

  void delete(T deleteT);

  boolean contains(K key);

}
