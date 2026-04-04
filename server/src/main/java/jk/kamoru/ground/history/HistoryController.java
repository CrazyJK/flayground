package jk.kamoru.ground.history;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.history.domain.History;
import jk.kamoru.ground.history.domain.History.Action;
import jk.kamoru.ground.history.service.HistoryService;

@io.swagger.v3.oas.annotations.tags.Tag(name = "History")
@RestController
@RequestMapping(Ground.API_PREFIX + "/info/histories")
public class HistoryController {

  @Autowired
  HistoryService historyService;

  @GetMapping(params = "search")
  public List<History> find(@RequestParam String search) {
    return historyService.find(search);
  }

  @GetMapping(params = "action")
  public List<History> findAction(@RequestParam Action action, @RequestParam(required = false) Integer days) {
    if (days != null) {
      return historyService.findByAction(action, days);
    }
    return historyService.findByAction(action);
  }

  @GetMapping
  public List<History> list() {
    return historyService.list();
  }

}
