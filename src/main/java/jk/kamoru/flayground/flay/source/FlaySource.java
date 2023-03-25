package jk.kamoru.flayground.flay.source;

import java.util.Collection;

import jk.kamoru.flayground.flay.domain.Flay;

public interface FlaySource {

  void load();

  Flay get(String key);

  Collection<Flay> list();

}
