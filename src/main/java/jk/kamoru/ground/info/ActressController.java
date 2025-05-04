package jk.kamoru.ground.info;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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

import io.swagger.v3.oas.annotations.Operation;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.info.domain.Actress;
import jk.kamoru.ground.info.service.ActressInfoService;
import jk.kamoru.ground.info.service.NameDistanceChecker.CheckResult;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Actress")
@RestController
@RequestMapping(Ground.API_PREFIX + "/info/actress")
public class ActressController {

  @Autowired
  ActressInfoService actressInfoService;

  @GetMapping("/{name}")
  public Actress get(@PathVariable String name) {
    return actressInfoService.get(name);
  }

  @GetMapping
  public Collection<Actress> list() {
    return actressInfoService.list();
  }

  @GetMapping("/map")
  public Map<String, Actress> map() {
    return actressInfoService.list().stream().collect(Collectors.toMap(Actress::getName, Function.identity()));
  }

  @GetMapping("/find/{query}")
  public Collection<Actress> find(@PathVariable String query) {
    return actressInfoService.find(query);
  }

  @GetMapping("/find/byLocalname/{localname}")
  public Collection<Actress> findByLocalname(@PathVariable String localname) {
    return actressInfoService.findByLocalname(localname);
  }

  @GetMapping("/func/nameCheck/{limit}")
  public List<CheckResult> funcNameCheck(@PathVariable double limit) {
    return actressInfoService.funcNameCheck(limit);
  }

  @Operation(summary = "신규 생성")
  @PostMapping
  public Actress create(@RequestBody Actress actress) {
    return actressInfoService.create(actress);
  }

  @Operation(summary = "수정")
  @PatchMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void update(@RequestBody Actress actress) {
    actressInfoService.update(actress);
  }

  @Operation(summary = "병합")
  @PutMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void persist(@RequestBody Actress actress) {
    actressInfoService.persist(actress);
  }

  @Operation(summary = "이름 변경")
  @PutMapping("/rename/{name}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void rename(@PathVariable String name, @RequestBody Actress actress) {
    actressInfoService.rename(actress, name);
  }

  @PutMapping("/favorite/{name}/{checked}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void setFavorite(@PathVariable String name, @PathVariable boolean checked) {
    actressInfoService.setFavorite(name, checked);
  }

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@RequestBody Actress actress) {
    actressInfoService.delete(actress);
  }

}
