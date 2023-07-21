package jk.kamoru.flayground.base.web.attach;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.flayground.Flayground;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class AttachFileNotfoundException extends AttachNotfoundException {

  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;
  
  public AttachFileNotfoundException(String attachFileId) {
    super("Notfound AttachFile: " + attachFileId);
  }

}
