package jk.kamoru.ground.base.web.sse;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SseMessage {

  public static enum Type {
    Batch, Notice, CURL
  }

  Type type;
  String message;

}
