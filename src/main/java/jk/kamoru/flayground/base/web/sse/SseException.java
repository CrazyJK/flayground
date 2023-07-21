package jk.kamoru.flayground.base.web.sse;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class SseException extends GroundException {

  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;

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
