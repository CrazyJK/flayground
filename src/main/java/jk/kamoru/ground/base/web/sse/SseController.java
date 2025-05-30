package jk.kamoru.ground.base.web.sse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletRequest;
import jk.kamoru.ground.Ground;
import lombok.extern.slf4j.Slf4j;

/**
 * SseController
 */
@Slf4j
@io.swagger.v3.oas.annotations.tags.Tag(name = "Sse")
@RestController
@RequestMapping(Ground.API_PREFIX)
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
