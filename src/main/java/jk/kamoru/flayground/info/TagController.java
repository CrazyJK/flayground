package jk.kamoru.flayground.info;

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

import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.service.TagInfoService;

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

  @PostMapping
  public Tag create(@RequestBody Tag tag) {
    return tagInfoService.create(tag);
  }

  @PatchMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void update(@RequestBody Tag tag) {
    tagInfoService.update(tag);
  }

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
