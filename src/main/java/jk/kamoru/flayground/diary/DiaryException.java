package jk.kamoru.flayground.diary;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class DiaryException extends GroundException {

  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;

  public DiaryException(String message) {
    super(message);
  }

  public DiaryException(Throwable cause) {
    super(cause);
  }

  public DiaryException(String message, Throwable cause) {
    super(message, cause);
  }

}

