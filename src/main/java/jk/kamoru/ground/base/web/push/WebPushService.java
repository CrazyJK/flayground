package jk.kamoru.ground.base.web.push;

import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;

@Slf4j
@Service
public class WebPushService {

  static {
    // Bouncy Castle 암호화 프로바이더 등록 (VAPID 서명에 필요)
    Security.addProvider(new BouncyCastleProvider());
  }

  @Value("${webpush.vapid.public-key}")
  private String publicKey;

  @Value("${webpush.vapid.private-key}")
  private String privateKey;

  @Value("${webpush.vapid.subject}")
  private String subject;

  @Autowired
  private PushSubscriptionRepository subscriptionRepository;

  @Autowired
  @Qualifier("webPushExecutor")
  private Executor executor;

  private PushService pushService;
  private final ObjectMapper objectMapper = new ObjectMapper();

  /**
   * Spring Bean 초기화 시 PushService 싱글톤 생성
   * 
   * @PostConstruct를 사용하여 @Value 주입 후 실행 보장
   */
  @PostConstruct
  void init() throws GeneralSecurityException {
    this.pushService = new PushService(publicKey, privateKey, subject);
    log.info("PushService initialized with VAPID keys (subject: {})", subject);
  }

  /**
   * 특정 사용자에게 알림 발송 (병렬 처리)
   */
  public void sendNotification(String userId, String title, String body, Map<String, Object> data) {
    List<PushSubscription> subscriptions = subscriptionRepository.findByUserId(userId);

    if (subscriptions.isEmpty()) {
      log.debug("No subscriptions found for user: {}", userId);
      return;
    }

    // 병렬 발송
    List<CompletableFuture<Void>> futures = subscriptions.stream().map(subscription -> sendPushMessageAsync(subscription, title, body, data)).collect(Collectors.toList());

    // 모든 발송 완료 대기
    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).thenRun(() -> log.info("Sent push notifications to {} subscriptions for user: {}", futures.size(), userId))
        .exceptionally(e -> {
          log.error("Error during batch notification send for user: {}", userId, e);
          return null;
        });
  }

  /**
   * 모든 사용자에게 브로드캐스트 (병렬 처리)
   */
  public void broadcast(String title, String body, Map<String, Object> data) {
    List<PushSubscription> allSubscriptions = subscriptionRepository.findAll();

    if (allSubscriptions.isEmpty()) {
      log.debug("No subscriptions found for broadcast");
      return;
    }

    log.info("Broadcasting push notification to {} subscriptions", allSubscriptions.size());

    // 병렬 브로드캐스트
    List<CompletableFuture<Void>> futures = allSubscriptions.stream().map(subscription -> sendPushMessageAsync(subscription, title, body, data)).collect(Collectors.toList());

    // 모든 발송 완료 대기
    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).thenRun(() -> log.info("Broadcast completed to {} subscriptions", futures.size())).exceptionally(e -> {
      log.error("Error during broadcast", e);
      return null;
    });
  }

  /**
   * 비동기 푸시 메시지 발송
   */
  @Async("webPushExecutor")
  public CompletableFuture<Void> sendPushMessageAsync(PushSubscription subscription, String title, String body, Map<String, Object> data) {
    return CompletableFuture.runAsync(() -> {
      try {
        sendPushMessage(subscription, title, body, data);
      } catch (Exception e) {
        // 구독이 만료되었거나 유효하지 않으면 삭제
        if (e.getMessage() != null && (e.getMessage().contains("410") || e.getMessage().contains("Gone"))) {
          subscriptionRepository.delete(subscription);
          log.info("Deleted expired subscription: {}", subscription.getEndpoint());
        } else {
          log.error("Failed to send push to {}: {}", subscription.getEndpoint(), e.getMessage());
        }
      }
    }, executor);
  }

  /**
   * 실제 푸시 메시지 전송 (VAPID 방식)
   */
  private void sendPushMessage(PushSubscription subscription, String title, String body, Map<String, Object> data) throws Exception {
    // Payload 생성 (Map 사용)
    Map<String, Object> payload = new HashMap<>();
    payload.put("title", title);
    payload.put("body", body);
    payload.put("icon", "/dist/favicon/flay.png");
    if (data != null) {
      payload.put("data", data);
    }

    // ObjectMapper로 안전하게 JSON 직렬화
    String payloadJson = objectMapper.writeValueAsString(payload);

    // Notification 객체 생성
    Notification notification = new Notification(subscription.getEndpoint(), subscription.getP256dh(), subscription.getAuth(), payloadJson.getBytes("UTF-8"));

    // 푸시 메시지 전송
    HttpResponse response = pushService.send(notification);
    int statusCode = response.getStatusLine().getStatusCode();

    // 응답 처리
    if (statusCode == 410) {
      // 410 Gone - 구독 만료
      throw new Exception("410");
    } else if (statusCode < 200 || statusCode >= 300) {
      // 기타 에러
      throw new Exception("Push failed with status: " + statusCode);
    }

    log.debug("Push notification sent successfully to {}", subscription.getEndpoint());
  }
}