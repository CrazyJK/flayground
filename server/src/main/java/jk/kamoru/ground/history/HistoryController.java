package jk.kamoru.ground.history;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.history.domain.History;
import jk.kamoru.ground.history.domain.History.Action;
import jk.kamoru.ground.history.service.HistoryService;

@io.swagger.v3.oas.annotations.tags.Tag(name = "History")
@RestController
@RequestMapping(Ground.API_PREFIX + "/info/history")
public class HistoryController {

  @Autowired
  HistoryService historyService;

  @GetMapping("/find/{query}")
  public List<History> find(@PathVariable String query) {
    return historyService.find(query);
  }

  @GetMapping("/find/action/{action}")
  public List<History> findAction(@PathVariable Action action) {
    return historyService.findByAction(action);
  }

  /**
   * 최근 days일 이내의 action에 해당하는 히스토리 조회
   *
   * @param action 히스토리 액션
   * @param days   최근 일수
   * @return 필터링된 히스토리 목록
   */
  @GetMapping("/find/action/{action}/{days}")
  public List<History> findActionByDays(@PathVariable Action action, @PathVariable int days) {
    return historyService.findByAction(action, days);
  }

  @GetMapping
  public List<History> list() {
    return historyService.list();
  }

}
