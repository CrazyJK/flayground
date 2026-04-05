package jk.kamoru.ground.base.web.sse;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class SseException extends GroundException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public SseException(String message) {
    super(message);
  }

  public SseException(Throwable cause) {
    super(cause);
  }

  public SseException(String message, Throwable cause) {
    super(message, cause);
  }

}
