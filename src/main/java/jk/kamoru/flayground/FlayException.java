package jk.kamoru.flayground;

public class FlayException extends RuntimeException {

  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;

  public FlayException() {
    super();
  }

  public FlayException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
    super(message, cause, enableSuppression, writableStackTrace);
  }

  public FlayException(String message, Throwable cause) {
    super(message, cause);
  }

  public FlayException(String message) {
    super(message);
  }

  public FlayException(Throwable e) {
    super(e);
  }

}
