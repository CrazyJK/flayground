package jk.kamoru.ground.info;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.flay.service.FlayService;
import jk.kamoru.ground.info.domain.TagGroup;
import jk.kamoru.ground.info.service.TagGroupInfoService;

@io.swagger.v3.oas.annotations.tags.Tag(name = "TagGroup")
@RestController
@RequestMapping(Ground.API_PREFIX + "/info/tagGroup")
public class TagGroupController {

  @Autowired
  TagGroupInfoService tagGroupInfoService;

  @Autowired
  FlayService flayService;

  @GetMapping("/{id}")
  public TagGroup get(@PathVariable String id) {
    return tagGroupInfoService.get(id);
  }

  @GetMapping
  public Collection<TagGroup> list() {
    return tagGroupInfoService.list();
  }

  @Operation(summary = "신규 생성")
  @PostMapping
  public TagGroup create(@RequestBody TagGroup tagGroup) {
    return tagGroupInfoService.create(tagGroup);
  }

  @Operation(summary = "수정")
  @PatchMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void update(@RequestBody TagGroup tagGroup) {
    tagGroupInfoService.update(tagGroup);
  }

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@RequestBody TagGroup tagGroup) {
    tagGroupInfoService.delete(tagGroup);
  }

}
