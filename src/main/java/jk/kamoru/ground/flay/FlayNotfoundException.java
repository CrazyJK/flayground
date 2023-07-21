package jk.kamoru.ground.flay;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class FlayNotfoundException extends FlayException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public FlayNotfoundException(String opus) {
    super("Notfound Flay: " + opus);
  }

}
