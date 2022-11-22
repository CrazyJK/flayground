package jk.kamoru.flayground.base.web.socket;

import java.util.concurrent.atomic.AtomicInteger;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class PayLoad {

  public static final String SERVER = "Server";

  private static final AtomicInteger integer = new AtomicInteger();


  @Builder.Default private int index = integer.incrementAndGet();
  @Builder.Default private long time = System.currentTimeMillis();
  private String type;
  private String from;
  private String to;
  private String subject;
  private String body;

}
