package jk.kamoru.ground.history.service;

import java.util.List;

import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.history.domain.History;
import jk.kamoru.ground.history.domain.History.Action;

public interface HistoryService {

  List<History> list();

  List<History> find(String query);

  List<History> findByAction(Action action);

  History findLastPlay(String opus);

  void save(Action play, Flay flay, String deletedReason);

}
