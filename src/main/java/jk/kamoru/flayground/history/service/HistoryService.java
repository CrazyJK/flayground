package jk.kamoru.flayground.history.service;

import java.util.List;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.history.domain.History;
import jk.kamoru.flayground.history.domain.History.Action;

public interface HistoryService {

  List<History> list();

  List<History> find(String query);

  void persist(History history);

  void save(Action play, Flay flay);

  List<History> findAction(Action action);

}
