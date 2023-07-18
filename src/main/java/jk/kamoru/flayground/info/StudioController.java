package jk.kamoru.flayground.info;

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
import jk.kamoru.flayground.info.domain.Studio;
import jk.kamoru.flayground.info.service.StudioInfoService;

@io.swagger.v3.oas.annotations.tags.Tag(name = "StudioController")
@RestController
@RequestMapping("/info/studio")
public class StudioController {

  @Autowired
  StudioInfoService studioInfoService;

  @GetMapping("/{name}")
  public Studio get(@PathVariable String name) {
    return studioInfoService.get(name);
  }

  @GetMapping
  public Collection<Studio> list() {
    return studioInfoService.list();
  }

  @GetMapping("/find/{query}")
  public Collection<Studio> find(@PathVariable String query) {
    return studioInfoService.find(query);
  }

  @GetMapping("/findOneByOpus/{opus}")
  public Studio findOneByOpus(@PathVariable String opus) {
    return studioInfoService.findOneByOpus(opus);
  }

  @Operation(summary = "신규 생성")
  @PostMapping
  public Studio create(@RequestBody Studio studio) {
    return studioInfoService.create(studio);
  }

  @Operation(summary = "수정")
  @PatchMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void update(@RequestBody Studio studio) {
    studioInfoService.update(studio);
  }

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@RequestBody Studio studio) {
    studioInfoService.delete(studio);
  }

}
