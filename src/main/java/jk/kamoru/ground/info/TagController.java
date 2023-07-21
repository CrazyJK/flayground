package jk.kamoru.ground.info;

import java.util.Collection;

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
import jk.kamoru.ground.info.domain.Tag;
import jk.kamoru.ground.info.service.TagInfoService;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Tag")
@RestController
@RequestMapping("/info/tag")
public class TagController {

  @Autowired
  TagInfoService tagInfoService;

  @GetMapping("/{id}")
  public Tag get(@PathVariable Integer id) {
    return tagInfoService.get(id);
  }

  @GetMapping
  public Collection<Tag> list() {
    return tagInfoService.list();
  }

  @GetMapping("/find/{query}")
  public Collection<Tag> find(@PathVariable String query) {
    return tagInfoService.find(query);
  }

  @Operation(summary = "신규 생성")
  @PostMapping
  public Tag create(@RequestBody Tag tag) {
    return tagInfoService.create(tag);
  }

  @Operation(summary = "수정")
  @PatchMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void update(@RequestBody Tag tag) {
    tagInfoService.update(tag);
  }

  @Operation(summary = "tag.id > 0 수정 else 신규")
  @PutMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void put(@RequestBody Tag tag) {
    System.out.println(tag);
    if (tag.getId() > 0) {
      tagInfoService.update(tag);
    } else {
      tagInfoService.create(tag);
    }
  }

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@RequestBody Tag tag) {
    tagInfoService.delete(tag);
  }

}
