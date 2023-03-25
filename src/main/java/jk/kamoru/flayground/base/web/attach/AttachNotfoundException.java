package jk.kamoru.flayground.base.web.attach;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.flayground.FlayException;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class AttachNotfoundException extends FlayException {

  public AttachNotfoundException(String attachId) {
    super("notfound Attach: " + attachId);
  }

}
