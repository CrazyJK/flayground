package jk.kamoru.flayground.base.web.attach;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class AttachFileNotfoundException extends AttachNotfoundException {

  public AttachFileNotfoundException(String attachFileId) {
    super("notfound AttachFile: " + attachFileId);
  }

}
