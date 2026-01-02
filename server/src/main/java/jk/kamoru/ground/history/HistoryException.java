package jk.kamoru.ground.history;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundException;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class HistoryException extends GroundException {

  private static final long serialVersionUID = Ground.SERIAL_VERSION_UID;

  public HistoryException(String message) {
    super(message);
  }

  public HistoryException(Throwable cause) {
    super(cause);
  }

  public HistoryException(String message, Throwable cause) {
    super(message, cause);
  }

}