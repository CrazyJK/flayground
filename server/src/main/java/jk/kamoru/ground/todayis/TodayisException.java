package jk.kamoru.ground.todayis;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class TodayisException extends GroundException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public TodayisException(String message) {
    super(message);
  }

  public TodayisException(Throwable cause) {
    super(cause);
  }

  public TodayisException(String message, Throwable cause) {
    super(message, cause);
  }
}
