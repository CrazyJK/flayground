package jk.kamoru.flayground.base.web.sse;

import org.springframework.beans.factory.annotation.Autowired;

import jk.kamoru.flayground.base.web.sse.SseMessage.Type;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class LogAndSse {

  @Autowired
  SseEmitters sseEmitters;

  protected void noticeLogger(String message) {
    log.debug(message);
    sseEmitters.send(SseMessage.builder().type(Type.Notice).message(message).build());
  }

  protected void noticeLogger(String format, Object... args) {
    noticeLogger(String.format(format, args));
  }

  protected void batchLogger(String message) {
    log.info(message);
    sseEmitters.send(SseMessage.builder().type(Type.Batch).message(message).build());
  }

  protected void batchLogger(String format, Object... args) {
    batchLogger(String.format(format, args));
  }

}
