package jk.kamoru.flayground.base;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class BaseException extends GroundException {

  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;

  public BaseException(String message) {
    super(message);
  }

  public BaseException(Throwable cause) {
    super(cause);
  }

  public BaseException(String message, Throwable cause) {
    super(message, cause);
  }

}
