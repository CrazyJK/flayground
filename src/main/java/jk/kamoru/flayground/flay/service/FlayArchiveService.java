package jk.kamoru.flayground.flay.service;

import java.util.Collection;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;

public interface FlayArchiveService {

  Flay get(String opus);

  Collection<Flay> list();

  Collection<Flay> find(Search search);

  Collection<Flay> find(String query);

  Collection<Flay> find(String field, String value);

  void toInstance(String opus);

}
