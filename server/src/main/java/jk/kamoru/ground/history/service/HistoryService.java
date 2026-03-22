package jk.kamoru.ground.history.service;

import java.util.List;

import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.history.domain.History;
import jk.kamoru.ground.history.domain.History.Action;

public interface HistoryService {

  List<History> list();

  List<History> find(String query);

  List<History> findByAction(Action action);

  /**
   * 최근 days일 이내의 action에 해당하는 히스토리 조회
   * 
   * @param action 히스토리 액션
   * @param days   최근 일수
   * @return 필터링된 히스토리 목록
   */
  List<History> findByAction(Action action, int days);

  History findLastPlay(String opus);

  void save(Action play, Flay flay, String deletedReason);

}
