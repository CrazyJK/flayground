package jk.kamoru.ground.flay.service;

import java.util.Collection;

import jk.kamoru.ground.flay.Search;
import jk.kamoru.ground.flay.domain.Flay;

public interface FlayArchiveService {

  Flay get(String opus);

  Collection<Flay> list();

  Collection<String> listOpus();

  Collection<Flay> find(Search search);

  Collection<Flay> find(String query);

  Collection<Flay> find(String field, String value);

  void toInstance(String opus);

}
