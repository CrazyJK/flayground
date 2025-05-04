package jk.kamoru.ground.flay;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.flay.service.FlayArchiveService;

@io.swagger.v3.oas.annotations.tags.Tag(name = "FlayArchive")
@RestController
@RequestMapping(Ground.API_PREFIX + "/archive")
public class FlayArchiveController {

  @Autowired
  FlayArchiveService flayArchiveService;

  @GetMapping("/{opus}")
  public Flay get(@PathVariable String opus) {
    return flayArchiveService.get(opus);
  }

  @GetMapping
  public Collection<Flay> list() {
    return flayArchiveService.list();
  }

  @GetMapping("/list/opus")
  public Collection<String> listOpus() {
    return flayArchiveService.listOpus();
  }

  @PatchMapping("/toInstance/{opus}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void toInstance(@PathVariable String opus) {
    flayArchiveService.toInstance(opus);
  }

  @GetMapping("/find/{key}/{value}")
  public Collection<Flay> findByKeyVakye(@PathVariable String key, @PathVariable String value) {
    return flayArchiveService.find(key, value);
  }

  @GetMapping("/find/{query}")
  public Collection<Flay> findByQuery(@PathVariable String query) {
    return flayArchiveService.find(query);
  }

}
