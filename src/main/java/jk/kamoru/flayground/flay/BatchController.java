package jk.kamoru.flayground.flay;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.BatchExecutor;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Batch")
@RestController
@RequestMapping("/batch")
public class BatchController {

  @Autowired
  BatchExecutor batchService;

  @GetMapping("/option/{option}")
  public Boolean getOption(@PathVariable BatchExecutor.Option option) {
    return batchService.getOption(option);
  }

  @PutMapping("/option/{option}")
  public Boolean setOption(@PathVariable BatchExecutor.Option option) {
    return batchService.toggleOption(option);
  }

  @PutMapping("/start/{operation}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void startBatch(@PathVariable BatchExecutor.Operation operation) {
    batchService.startBatch(operation);
  }

  @GetMapping("/check/{operation}")
  public Map<String, List<Flay>> checkBatch(@PathVariable BatchExecutor.Operation operation) {
    return batchService.checkBatch(operation);
  }

  @PutMapping("/reload")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void reload() {
    batchService.reload();
  }

}
