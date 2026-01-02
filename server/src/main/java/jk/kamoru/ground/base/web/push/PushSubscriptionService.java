package jk.kamoru.ground.base.web.push;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

/**
 * Push 알림 구독 관리 Service
 */
@Slf4j
@Service
@Transactional
public class PushSubscriptionService {

  @Autowired
  private PushSubscriptionRepository subscriptionRepository;

  /**
   * 구독 등록 또는 업데이트
   *
   * @param userId          사용자 ID
   * @param subscriptionDTO 구독 정보
   * @return 저장된 구독 정보
   */
  public PushSubscription subscribe(String userId, PushSubscriptionDTO subscriptionDTO) {
    // 기존 구독 정보 확인
    Optional<PushSubscription> existingSubscription = subscriptionRepository.findByEndpoint(subscriptionDTO.getEndpoint());

    PushSubscription subscription;
    if (existingSubscription.isPresent()) {
      // 기존 구독 정보 업데이트
      subscription = existingSubscription.get();
      subscription.setUserId(userId);
      subscription.setP256dh(subscriptionDTO.getKeys().getP256dh());
      subscription.setAuth(subscriptionDTO.getKeys().getAuth());
      log.info("Updated existing push subscription for user: {}", userId);
    } else {
      // 새 구독 정보 생성
      subscription = new PushSubscription();
      subscription.setUserId(userId);
      subscription.setEndpoint(subscriptionDTO.getEndpoint());
      subscription.setP256dh(subscriptionDTO.getKeys().getP256dh());
      subscription.setAuth(subscriptionDTO.getKeys().getAuth());
      log.info("Created new push subscription for user: {}", userId);
    }

    return subscriptionRepository.save(subscription);
  }

  /**
   * 구독 해제
   *
   * @param userId          사용자 ID
   * @param subscriptionDTO 구독 정보
   */
  public void unsubscribe(String userId, PushSubscriptionDTO subscriptionDTO) {
    Optional<PushSubscription> subscription = subscriptionRepository.findByEndpoint(subscriptionDTO.getEndpoint());

    if (subscription.isPresent()) {
      PushSubscription sub = subscription.get();
      if (sub.getUserId().equals(userId)) {
        subscriptionRepository.delete(sub);
        log.info("Deleted push subscription for user: {}", userId);
      } else {
        log.warn("User ID mismatch for endpoint: {}", subscriptionDTO.getEndpoint());
      }
    } else {
      log.warn("Push subscription not found for user: {} with endpoint: {}", userId, subscriptionDTO.getEndpoint());
    }
  }

  /**
   * 사용자의 구독 정보 조회
   *
   * @param userId 사용자 ID
   * @return 구독 정보 DTO
   */
  public PushSubscriptionDTO getSubscription(String userId) {
    List<PushSubscription> subscriptions = subscriptionRepository.findByUserId(userId);

    if (subscriptions.isEmpty()) {
      return null;
    }

    // 첫 번째 구독 정보 반환 (보통 사용자당 1개의 구독)
    PushSubscription subscription = subscriptions.get(0);

    PushSubscriptionDTO dto = new PushSubscriptionDTO();
    dto.setEndpoint(subscription.getEndpoint());

    PushSubscriptionDTO.Keys keys = new PushSubscriptionDTO.Keys();
    keys.setP256dh(subscription.getP256dh());
    keys.setAuth(subscription.getAuth());
    dto.setKeys(keys);

    return dto;
  }

  /**
   * 사용자의 모든 구독 정보 조회
   *
   * @param userId 사용자 ID
   * @return 구독 정보 목록
   */
  public List<PushSubscription> getSubscriptions(String userId) {
    return subscriptionRepository.findByUserId(userId);
  }

  /**
   * 만료된 구독 정보 삭제
   *
   * @param subscription 구독 정보
   */
  public void deleteExpiredSubscription(PushSubscription subscription) {
    if (subscription != null) {
      subscriptionRepository.delete(subscription);
      log.info("Deleted expired push subscription: {}", subscription.getId());
    } else {
      log.warn("Attempted to delete null subscription");
    }
  }
}
