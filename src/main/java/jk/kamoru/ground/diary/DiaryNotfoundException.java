package jk.kamoru.ground.diary;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class DiaryNotfoundException extends DiaryException {
    
  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public DiaryNotfoundException(String message) {
    super("Notfound Diary: " + message);
  }

}
