package jk.kamoru.flayground.history.service;

import java.util.List;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.history.domain.History;
import jk.kamoru.flayground.history.domain.History.Action;

public interface HistoryService {

  List<History> list();

  List<History> find(String query);

  List<History> findByAction(Action action);

  History findLastPlay(String opus);

  void persist(History history);

  void save(Action play, Flay flay, String deletedReason);

}
