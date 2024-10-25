package jk.kamoru.ground.base.web.sse;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.info.domain.Actress;
import jk.kamoru.ground.info.domain.Studio;
import jk.kamoru.ground.info.domain.Tag;
import jk.kamoru.ground.info.domain.Video;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class SseEmitters {

  private static enum EVENT {
    CONNECT, FLAY, STUDIO, VIDEO, ACTRESS, TAG, MESSAGE;
  }

  private final List<SseEmitter> sseEmitters = new CopyOnWriteArrayList<>();

  protected SseEmitter create() {
    final Long TIMEOUT = Duration.ofHours(6).toMillis();
    SseEmitter sseEmitter = new SseEmitter(TIMEOUT);
    sseEmitter.onCompletion(() -> {
      log.debug("{} onCompletion", sseEmitter);
      remove(sseEmitter);
    });
    sseEmitter.onTimeout(() -> {
      log.debug("{} onTimeout", sseEmitter);
      sseEmitter.complete();
    });
    sseEmitter.onError((e) -> {
      // log.error("{} onError: {}", sseEmitter, e.getMessage());
      sseEmitter.complete();
    });

    sseEmitters.add(sseEmitter);
    log.debug("{} created. total {} sseEmitters", sseEmitter, sseEmitters.size());

    send(sseEmitter, EVENT.CONNECT, "connected");

    return sseEmitter;
  }

  private void remove(SseEmitter sseEmitter) {
    boolean removed = sseEmitters.remove(sseEmitter);
    log.debug("{} removed [{}]. total {} sseEmitters", sseEmitter, removed, sseEmitters.size());
  }

  private void send(SseEmitter sseEmitter, EVENT event, Object payload) {
    final String name = event.name();
    if (name == null)
      throw new IllegalArgumentException("null is null");
    if (payload == null)
      throw new IllegalArgumentException("payload is null");
    try {
      sseEmitter.send(SseEmitter.event().name(name).data(payload));
      log.debug("{} send {} - {}", sseEmitter, event, payload);
    } catch (IOException e) {
      log.debug("{} send error: {}", sseEmitter, e.getMessage());
      remove(sseEmitter);
    } catch (Exception e) {
      log.debug("{} send error: {}", sseEmitter, e.getMessage());
      remove(sseEmitter);
    }
  }

  private void send(EVENT event, Object payload) {
    sseEmitters.forEach((sseEmitter) -> {
      send(sseEmitter, event, payload);
    });
  }

  public void send(Object object) {
    if (object instanceof Flay) {
      send(EVENT.FLAY, object);
    } else if (object instanceof Studio) {
      send(EVENT.STUDIO, object);
    } else if (object instanceof Video) {
      send(EVENT.VIDEO, object);
    } else if (object instanceof Actress) {
      send(EVENT.ACTRESS, object);
    } else if (object instanceof Tag) {
      send(EVENT.TAG, object);
    } else if (object instanceof SseMessage) {
      send(EVENT.MESSAGE, object);
    } else {
      throw new SseException("undefined object");
    }
  }

}
