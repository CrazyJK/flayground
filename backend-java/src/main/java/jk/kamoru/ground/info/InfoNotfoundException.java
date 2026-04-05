package jk.kamoru.ground.info;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class InfoNotfoundException extends InfoException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public InfoNotfoundException(Object key) {
    super("Notfound Info: " + key.toString());
  }

}
