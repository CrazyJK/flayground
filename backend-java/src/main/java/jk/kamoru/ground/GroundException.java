package jk.kamoru.ground;

public abstract class GroundException extends RuntimeException {

  public GroundException(String message) {
    super(message);
  }

  public GroundException(Throwable cause) {
    super(cause);
  }

  public GroundException(String message, Throwable cause) {
    super(message, cause);
  }

}
