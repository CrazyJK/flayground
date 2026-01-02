package jk.kamoru.ground.base.web.push;

import lombok.Data;

/**
 * Push 알림 구독 정보 DTO
 */
@Data
public class PushSubscriptionDTO {

  private String endpoint;
  private Keys keys;

  @Data
  public static class Keys {
    private String p256dh;
    private String auth;
  }
}
