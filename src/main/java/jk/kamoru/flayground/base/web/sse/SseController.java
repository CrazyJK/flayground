package jk.kamoru.flayground.base.web.sse;

import javax.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import lombok.extern.slf4j.Slf4j;

/**
 * SseController
 */
@Slf4j
@RestController
public class SseController {

  private final SseEmitters sseEmitters;

  public SseController(SseEmitters sseEmitters) {
    this.sseEmitters = sseEmitters;
  }

  @GetMapping("/sse")
  public SseEmitter sse(HttpServletRequest request) {
    log.debug("connected from {}", request.getRemoteUser());
    return sseEmitters.create();
  }

}
