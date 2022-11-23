package jk.kamoru.flayground.image;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import jk.kamoru.flayground.Flayground;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ImageNotfoundException extends RuntimeException {
  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;

  public ImageNotfoundException(int index) {
    super("Notfound image " + index);
  }
}
