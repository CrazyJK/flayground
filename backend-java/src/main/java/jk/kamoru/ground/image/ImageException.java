package jk.kamoru.ground.image;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class ImageException extends GroundException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public ImageException(String message) {
    super(message);
  }

  public ImageException(Throwable cause) {
    super(cause);
  }

  public ImageException(String message, Throwable cause) {
    super(message, cause);
  }

}
