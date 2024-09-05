package jk.kamoru.ground.base.web.attach;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class AttachException extends GroundException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public AttachException(String message) {
    super(message);
  }

  public AttachException(Throwable cause) {
    super(cause);
  }

  public AttachException(String message, Throwable cause) {
    super(message, cause);
  }

}
