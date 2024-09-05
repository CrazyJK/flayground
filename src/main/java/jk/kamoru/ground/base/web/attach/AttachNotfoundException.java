package jk.kamoru.ground.base.web.attach;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class AttachNotfoundException extends AttachException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public AttachNotfoundException(String attachId) {
    super("Notfound Attach: " + attachId);
  }

}
