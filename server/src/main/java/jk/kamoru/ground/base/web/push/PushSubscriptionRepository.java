package jk.kamoru.ground.base.web.push;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Push 알림 구독 정보 Repository
 */
@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

  /**
   * 사용자 ID로 구독 정보 조회
   *
   * @param userId 사용자 ID
   * @return 구독 정보 목록
   */
  List<PushSubscription> findByUserId(String userId);

  /**
   * Endpoint로 구독 정보 조회
   *
   * @param endpoint Push 알림 endpoint
   * @return 구독 정보
   */
  Optional<PushSubscription> findByEndpoint(String endpoint);

  /**
   * 사용자 ID와 Endpoint로 구독 정보 존재 여부 확인
   *
   * @param userId   사용자 ID
   * @param endpoint Push 알림 endpoint
   * @return 존재 여부
   */
  boolean existsByUserIdAndEndpoint(String userId, String endpoint);

  /**
   * Endpoint로 구독 정보 삭제
   *
   * @param endpoint Push 알림 endpoint
   */
  void deleteByEndpoint(String endpoint);

  /**
   * 사용자 ID로 모든 구독 정보 삭제
   *
   * @param userId 사용자 ID
   */
  void deleteByUserId(String userId);
}
