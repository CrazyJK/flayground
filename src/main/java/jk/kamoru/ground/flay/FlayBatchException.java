package jk.kamoru.ground.flay;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class FlayBatchException extends FlayException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public FlayBatchException(String message) {
    super(message);
  }

  public FlayBatchException(Throwable cause) {
    super(cause);
  }

  public FlayBatchException(String message, Throwable cause) {
    super(message, cause);
  }

}
