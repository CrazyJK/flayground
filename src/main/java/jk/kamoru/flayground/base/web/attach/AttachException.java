package jk.kamoru.flayground.base.web.attach;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class AttachException extends GroundException {

  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;

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
