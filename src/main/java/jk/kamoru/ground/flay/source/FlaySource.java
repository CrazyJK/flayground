package jk.kamoru.ground.flay.source;

import java.util.Collection;

import jk.kamoru.ground.flay.domain.Flay;

public interface FlaySource {

  void load();

  Flay get(String key);

  Collection<Flay> list();

}
