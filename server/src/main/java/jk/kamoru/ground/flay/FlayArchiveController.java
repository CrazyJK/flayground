package jk.kamoru.ground.flay;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.flay.service.FlayArchiveService;

@io.swagger.v3.oas.annotations.tags.Tag(name = "FlayArchive")
@RestController
@RequestMapping(Ground.API_PREFIX + "/archives")
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

  @GetMapping(params = "fields=opus")
  public Collection<String> listOpus() {
    return flayArchiveService.listOpus();
  }

  @PostMapping("/{opus}/to-instance")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void toInstance(@PathVariable String opus) {
    flayArchiveService.toInstance(opus);
  }

  @GetMapping(params = { "key", "value" })
  public Collection<Flay> findByKeyVakye(@RequestParam String key, @RequestParam String value) {
    return flayArchiveService.find(key, value);
  }

  @GetMapping(params = "search")
  public Collection<Flay> findByQuery(@RequestParam String search) {
    return flayArchiveService.find(search);
  }

}
