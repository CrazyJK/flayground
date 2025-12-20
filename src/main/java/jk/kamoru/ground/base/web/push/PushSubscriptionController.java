package jk.kamoru.ground.base.web.push;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/push")
public class PushSubscriptionController {

  @Autowired
  private PushSubscriptionService pushService;

  /**
   * Push 구독 등록
   */
  @PostMapping("/subscribe")
  public ResponseEntity<Void> subscribe(@RequestBody PushSubscriptionDTO subscription, HttpServletRequest request) {
    String userId = getUserIdFromSession(request);
    pushService.subscribe(userId, subscription);
    return ResponseEntity.ok().build();
  }

  /**
   * Push 구독 해제
   */
  @DeleteMapping("/unsubscribe")
  public ResponseEntity<Void> unsubscribe(@RequestBody PushSubscriptionDTO subscription, HttpServletRequest request) {
    String userId = getUserIdFromSession(request);
    pushService.unsubscribe(userId, subscription);
    return ResponseEntity.ok().build();
  }

  /**
   * 사용자의 구독 정보 조회
   */
  @GetMapping("/subscription")
  public ResponseEntity<PushSubscriptionDTO> getSubscription(HttpServletRequest request) {
    String userId = getUserIdFromSession(request);
    PushSubscriptionDTO subscription = pushService.getSubscription(userId);
    return ResponseEntity.ok(subscription);
  }

  /**
   * 세션에서 사용자 ID를 가져옵니다. 세션에 userId가 없으면 IP 기반으로 자동 생성하여 세션에 저장합니다.
   *
   * @param request HTTP 요청
   * @return 사용자 ID
   */
  private String getUserIdFromSession(HttpServletRequest request) {
    HttpSession session = request.getSession(true);
    String userId = (String) session.getAttribute("userId");

    if (userId == null) {
      // IP 주소 기반 사용자 ID 생성
      String remoteAddr = getClientIpAddress(request);
      userId = "user_" + remoteAddr.replace(".", "_").replace(":", "_");
      session.setAttribute("userId", userId);
      log.info("Created new session userId: {} for IP: {}", userId, remoteAddr);
    }

    return userId;
  }

  /**
   * 클라이언트 IP 주소를 가져옵니다. 프록시 환경을 고려하여 X-Forwarded-For 헤더를 먼저 확인합니다.
   *
   * @param request HTTP 요청
   * @return 클라이언트 IP 주소
   */
  private String getClientIpAddress(HttpServletRequest request) {
    String ip = request.getHeader("X-Forwarded-For");

    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getHeader("Proxy-Client-IP");
    }
    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getHeader("WL-Proxy-Client-IP");
    }
    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getHeader("HTTP_X_FORWARDED_FOR");
    }
    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getRemoteAddr();
    }

    // X-Forwarded-For는 여러 IP를 포함할 수 있으므로 첫 번째 IP만 사용
    if (ip != null && ip.contains(",")) {
      ip = ip.split(",")[0].trim();
    }

    return ip;
  }
}