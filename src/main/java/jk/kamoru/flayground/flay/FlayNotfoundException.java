package jk.kamoru.flayground.flay;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.flayground.GroundException;
import jk.kamoru.flayground.Flayground;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class FlayNotfoundException extends GroundException {

  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;

  public FlayNotfoundException(String opus) {
    super("Notfound flay " + opus);
  }

}
