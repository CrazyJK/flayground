package jk.kamoru.flayground.info;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class InfoException extends GroundException {

  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;

  public InfoException(String message) {
    super(message);
  }

  public InfoException(Throwable cause) {
    super(cause);
  }

  public InfoException(String message, Throwable cause) {
    super(message, cause);
  }

}
