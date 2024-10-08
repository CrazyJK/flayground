package jk.kamoru.ground.flay;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class FlayException extends GroundException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public FlayException(String message) {
    super(message);
  }

  public FlayException(Throwable cause) {
    super(cause);
  }

  public FlayException(String message, Throwable cause) {
    super(message, cause);
  }

}
