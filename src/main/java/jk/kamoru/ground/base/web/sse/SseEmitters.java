package jk.kamoru.ground.base.web.sse;

import java.io.IOException;
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
    SseEmitter sseEmitter = new SseEmitter(Long.MAX_VALUE);

    sseEmitter.onCompletion(() -> {
      log.info("{} onCompletion - 클라이언트가 정상적으로 연결을 종료했습니다", sseEmitter);
      remove(sseEmitter);
    });
    sseEmitter.onTimeout(() -> {
      log.warn("{} onTimeout - SSE 연결이 타임아웃되었습니다", sseEmitter);
      sseEmitter.complete();
    });
    sseEmitter.onError((e) -> {
      log.error("{} onError - SSE 연결 중 오류 발생: {} ({})", sseEmitter, e.getMessage(), e.getClass().getSimpleName());
      // remove(sseEmitter); // 오류 발생 시 즉시 제거
    });

    sseEmitters.add(sseEmitter);
    log.info("{} created. total {} sseEmitters", sseEmitter, sseEmitters.size());

    return sseEmitter;
  }

  private void remove(SseEmitter sseEmitter) {
    boolean removed = sseEmitters.remove(sseEmitter);
    log.debug("{} removed [{}]. total {} sseEmitters", sseEmitter, removed, sseEmitters.size());
  }

  private void send(SseEmitter sseEmitter, EVENT event, Object payload) {
    final String name = event.name();
    if (name == null)
      throw new IllegalArgumentException("event name is null");
    if (payload == null)
      throw new IllegalArgumentException("payload is null");

    try {
      sseEmitter.send(SseEmitter.event().name(name).data(payload));
      log.debug("{} send {} - {}", sseEmitter, event, payload);
    } catch (IOException e) {
      log.warn("{} IOException during send: {} - 클라이언트 연결 끊김으로 추정", sseEmitter, e.getMessage());
      remove(sseEmitter);
    } catch (IllegalStateException e) {
      log.warn("{} IllegalStateException during send: {} - SSE 연결 상태 이상", sseEmitter, e.getMessage());
      remove(sseEmitter);
    } catch (Exception e) {
      log.error("{} Unexpected error during send: {} ({})", sseEmitter, e.getMessage(), e.getClass().getSimpleName(), e);
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
