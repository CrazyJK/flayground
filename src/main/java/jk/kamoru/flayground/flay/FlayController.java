package jk.kamoru.flayground.flay;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.domain.FlayCondition;
import jk.kamoru.flayground.flay.service.FlayCollector;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.flay.service.ScoreCalculator;
import jk.kamoru.flayground.info.domain.Actress;
import jk.kamoru.flayground.info.service.ActressInfoService;

@RestController
@RequestMapping("/flay")
public class FlayController {

  @Autowired
  FlayService flayService;

  @Autowired
  ActressInfoService actressInfoService;

  @Autowired
  ScoreCalculator scoreCalculator;

  @Autowired
  FlayCollector flayCollector;

  @GetMapping("/{opus}")
  public Flay get(@PathVariable String opus) {
    return flayService.get(opus);
  }

  @GetMapping("/{opus}/score")
  public int getScore(@PathVariable String opus) {
    Flay flay = flayService.get(opus);
    scoreCalculator.calcScore(flay);
    return flay.getScore();
  }

  @GetMapping("/{opus}/fully")
  public Map<String, Object> getFullyFlay(@PathVariable String opus) {
    Flay flay = flayService.get(opus);
    scoreCalculator.calcScore(flay);
    List<Actress> actressList = flay.getActressList().stream().map(name -> actressInfoService.get(name)).toList();

    Map<String, Object> objects = new HashMap<>();
    objects.put("flay", flay);
    objects.put("actress", actressList);
    return objects;
  }

  @GetMapping
  public Collection<Flay> getList() {
    return flayService.list();
  }

  @GetMapping("/list/lowScore")
  public Collection<Flay> getListOfLowScore() {
    return flayService.listOfLowScore();
  }

  @GetMapping("/list/orderbyScoreDesc")
  public Collection<Flay> getListOrderbyScoreDesc() {
    return flayService.listOrderbyScoreDesc();
  }

  @PostMapping("/list/flay")
  public List<Flay> getFlayList(@RequestBody FlayCondition flayCondition) {
    return flayCollector.toFlayList(flayService.list(), flayCondition);
  }

  @PostMapping("/list/studio")
  public List<String> getStudioList(@RequestBody FlayCondition flayCondition) {
    return flayCollector.toStudioList(flayService.list(), flayCondition);
  }

  @PostMapping("/list/opus")
  public List<String> getOpusList(@RequestBody FlayCondition flayCondition) {
    return flayCollector.toOpusList(flayService.list(), flayCondition);
  }

  @PostMapping("/list/title")
  public List<String> getTitleList(@RequestBody FlayCondition flayCondition) {
    return flayCollector.toTitleList(flayService.list(), flayCondition);
  }

  @PostMapping("/list/actress")
  public List<String> getActressList(@RequestBody FlayCondition flayCondition) {
    return flayCollector.toActressList(flayService.list(), flayCondition);
  }

  @PostMapping("/list/release")
  public List<String> getReleaseList(@RequestBody FlayCondition flayCondition) {
    return flayCollector.toReleaseList(flayService.list(), flayCondition);
  }

  @GetMapping("/find")
  public Collection<Flay> findList(@RequestBody Search search) {
    return flayService.find(search);
  }

  @GetMapping("/find/{query}")
  public Collection<Flay> findList(@PathVariable String query) {
    return flayService.find(query);
  }

  @GetMapping("/find/{field}/{value}")
  public Collection<Flay> findByFieldValue(@PathVariable String field, @PathVariable String value) {
    return flayService.find(field, value);
  }

  @GetMapping("/count/{field}/{value}")
  public int countByFieldValue(@PathVariable String field, @PathVariable String value) {
    return flayService.find(field, value).size();
  }

  @GetMapping("/find/tag/{id}/like")
  public Collection<Flay> findByTagLike(@PathVariable Integer id) {
    return flayService.findByTagLike(id);
  }

  @GetMapping("/candidates")
  public Collection<Flay> findCandidates() {
    return flayService.findCandidates();
  }

  @PatchMapping("/candidates/{opus}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void acceptCandidates(@PathVariable String opus) {
    flayService.acceptCandidates(opus);
  }

  @PatchMapping("/play/{opus}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void play(@PathVariable String opus) {
    flayService.play(opus);
  }

  @PatchMapping("/edit/{opus}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void edit(@PathVariable String opus) {
    flayService.edit(opus);
  }

  @PutMapping("/rename/{opus}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void rename(@PathVariable String opus, @RequestBody Flay flay) {
    flayService.rename(opus, flay);
  }

  @PutMapping("/open/folder")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void openFolder(@RequestBody String folder) {
    flayService.openFolder(folder);
  }

  @DeleteMapping("/file")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteFile(@RequestBody String file) {
    flayService.deleteFile(file);
  }

  @DeleteMapping("/file/{opus}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteFileOnFlay(@PathVariable String opus, @RequestBody String file) {
    flayService.deleteFileOnFlay(opus, file);
  }

}
