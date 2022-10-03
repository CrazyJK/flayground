package jk.kamoru.flayground.flay;

import java.util.Collection;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayArchiveService;

@RestController
@RequestMapping("/archive")
public class FlayArchiveController {

  @Autowired FlayArchiveService flayArchiveService;

  @GetMapping("/{opus}")
  public Flay get(@PathVariable String opus) {
    return flayArchiveService.get(opus);
  }

  @GetMapping("/page")
  public Page<Flay> page(
      @PageableDefault(size = 10, page = 0) Pageable pageable,
      @RequestParam(value = "keyword", required = false, defaultValue = "") String keyword) {
    return flayArchiveService.page(pageable, keyword);
  }

  @GetMapping("/list")
  public Collection<Flay> list() {
    return flayArchiveService.list();
  }

  @PatchMapping("/toInstance/{opus}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void toInstance(@PathVariable String opus) {
    flayArchiveService.toInstance(opus);
  }

  @GetMapping("/find/{key}/{value}")
  public List<Flay> findActress(@PathVariable String key, @PathVariable String value) {
    return flayArchiveService.find(key, value);
  }

}
