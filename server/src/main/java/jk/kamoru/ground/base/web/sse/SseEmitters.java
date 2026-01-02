package jk.kamoru.ground.base.web.sse;

import java.io.IOException;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jk.kamoru.ground.base.web.push.WebPushService;
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
  private final Long TIMEOUT = Duration.ofHours(6).toMillis();

  @Autowired(required = false)
  private WebPushService webPushService;

  protected SseEmitter create() {
    SseEmitter sseEmitter = new SseEmitter(TIMEOUT);

    sseEmitter.onCompletion(() -> {
      log.info("{} onCompletion", sseEmitter);
      remove(sseEmitter);
    });
    sseEmitter.onTimeout(() -> {
      log.warn("{} onTimeout", sseEmitter);
      sseEmitter.complete();
    });
    sseEmitter.onError((e) -> {
      log.error("{} onError: {} ({})", sseEmitter, e.getMessage(), e.getClass().getSimpleName());
      remove(sseEmitter);
    });

    sseEmitters.add(sseEmitter);
    log.info("{} created. total {} sseEmitters", sseEmitter, sseEmitters.size());

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
      SseMessage message = (SseMessage) object;

      // Notice 타입은 Web Push로 전송
      if (message.getType() == SseMessage.Type.Notice) {
        sendMessageViaPush(message);
      } else {
        // Batch, CURL 등 나머지는 SSE로 전송
        send(EVENT.MESSAGE, object);
      }
    } else {
      throw new SseException("undefined object");
    }
  }

  /**
   * SseMessage를 Web Push로 전송 (Notice, CURL 타입만)
   */
  private void sendMessageViaPush(SseMessage message) {
    if (webPushService == null) {
      log.warn("WebPushService is not available. Message will be lost: {}", message.getMessage());
      return;
    }

    try {
      String title = "Flayground 알림";
      String body = message.getMessage() != null ? message.getMessage() : "";

      // message type에 따라 title 변경
      if (message.getType() != null) {
        switch (message.getType()) {
        case Batch:
          title = "🔄 작업 알림";
          break;
        case Notice:
          title = "🔔 중요 알림";
          break;
        case CURL:
          title = "🌐 크롤링 알림";
          break;
        default:
          break;
        }
      }

      // 추가 데이터
      Map<String, Object> data = new HashMap<>();
      data.put("type", message.getType() != null ? message.getType().name() : "MESSAGE");
      data.put("timestamp", System.currentTimeMillis());

      // 모든 사용자에게 브로드캐스트
      webPushService.broadcast(title, body, data);
      log.info("Sent message via Web Push: {}", body);
    } catch (Exception e) {
      log.error("Failed to send message via Web Push: {}", e.getMessage(), e);
    }
  }

}
