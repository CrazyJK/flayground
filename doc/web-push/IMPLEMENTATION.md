# Web Push 구현 가이드

## 완료된 프론트엔드 구현

### 1. 서비스 워커

- **파일**: [src/service-worker.ts](www/src/service-worker.ts)
- **기능**:
  - Push 알림 수신 및 표시
  - 알림 클릭 시 페이지 포커스/열기
  - 정적 리소스 캐싱 (Network-first 전략)
  - Background Sync 지원

### 2. Push 알림 관리 클래스

- **파일**: [src/lib/PushNotification.ts](www/src/lib/PushNotification.ts)
- **기능**:
  - 알림 권한 요청
  - Push 구독/구독 해제
  - 서버와 구독 정보 동기화 (API: `/api/push/subscribe`, `/api/push/unsubscribe`)
  - VAPID 키 변환 유틸리티

### 3. 알림 권한 UI 컴포넌트

- **파일**: [src/ui/NotificationPermission.ts](www/src/ui/NotificationPermission.ts)
- **사용법**:
  ```html
  <notification-permission></notification-permission>
  ```
- **기능**:
  - 알림 활성화/비활성화 버튼
  - 구독 상태 표시
  - 테스트 알림 발송

### 4. Webpack 설정

- **파일**: [webpack.common.cjs](www/webpack.common.cjs)
- 서비스 워커를 `/dist/service-worker.js`로 번들링

## 백엔드 구현 필요 사항

### 1. VAPID 키 생성

```bash
# Node.js 환경에서
yarn add web-push
npx web-push generate-vapid-keys
```

생성된 키를 `application.properties`에 추가:

```properties
# Web Push 설정
webpush.vapid.public-key=YOUR_PUBLIC_KEY
webpush.vapid.private-key=YOUR_PRIVATE_KEY
webpush.vapid.subject=mailto:your-email@example.com
```

### 2. 구독 관리 엔티티 생성

```java
@Entity
@Table(name = "push_subscription")
public class PushSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId; // 또는 사용자 FK

    @Column(nullable = false, unique = true, length = 500)
    private String endpoint;

    @Column(nullable = false)
    private String p256dh;

    @Column(nullable = false)
    private String auth;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
```

### 3. 구독 관리 REST API

**PushSubscriptionController.java**:

```java
@RestController
@RequestMapping("/api/push")
public class PushSubscriptionController {

    @Autowired
    private PushSubscriptionService pushService;

    /**
     * Push 구독 등록
     */
    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(@RequestBody PushSubscriptionDTO subscription) {
        pushService.subscribe(getCurrentUserId(), subscription);
        return ResponseEntity.ok().build();
    }

    /**
     * Push 구독 해제
     */
    @DeleteMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(@RequestBody PushSubscriptionDTO subscription) {
        pushService.unsubscribe(getCurrentUserId(), subscription);
        return ResponseEntity.ok().build();
    }

    /**
     * 사용자의 구독 정보 조회
     */
    @GetMapping("/subscription")
    public ResponseEntity<PushSubscriptionDTO> getSubscription() {
        PushSubscriptionDTO subscription = pushService.getSubscription(getCurrentUserId());
        return ResponseEntity.ok(subscription);
    }

    private String getCurrentUserId() {
        // 현재 사용자 ID 반환 (세션, JWT 등에서)
        return "user123"; // TODO: 실제 구현
    }
}
```

### 4. Web Push 발송 서비스

**WebPushService.java**:

```java
@Service
public class WebPushService {

    @Value("${webpush.vapid.public-key}")
    private String publicKey;

    @Value("${webpush.vapid.private-key}")
    private String privateKey;

    @Value("${webpush.vapid.subject}")
    private String subject;

    @Autowired
    private PushSubscriptionRepository subscriptionRepository;

    /**
     * 특정 사용자에게 알림 발송
     */
    public void sendNotification(String userId, String title, String body, Map<String, Object> data) {
        List<PushSubscription> subscriptions = subscriptionRepository.findByUserId(userId);

        for (PushSubscription subscription : subscriptions) {
            try {
                sendPushMessage(subscription, title, body, data);
            } catch (Exception e) {
                // 구독이 만료되었거나 유효하지 않으면 삭제
                if (e.getMessage().contains("410")) {
                    subscriptionRepository.delete(subscription);
                }
                log.error("Failed to send push notification to {}: {}", userId, e.getMessage());
            }
        }
    }

    /**
     * 모든 사용자에게 브로드캐스트
     */
    public void broadcast(String title, String body, Map<String, Object> data) {
        List<PushSubscription> allSubscriptions = subscriptionRepository.findAll();

        for (PushSubscription subscription : allSubscriptions) {
            try {
                sendPushMessage(subscription, title, body, data);
            } catch (Exception e) {
                log.error("Failed to broadcast to subscription {}: {}", subscription.getId(), e.getMessage());
            }
        }
    }

    /**
     * 실제 푸시 메시지 전송 (FCM 또는 VAPID)
     */
    private void sendPushMessage(PushSubscription subscription, String title, String body, Map<String, Object> data) throws Exception {
        // nl.martijndwars:web-push 라이브러리 사용
        // 또는 FCM Admin SDK 사용

        JSONObject payload = new JSONObject();
        payload.put("title", title);
        payload.put("body", body);
        payload.put("icon", "/dist/favicon/flay.png");
        payload.put("data", data);

        // TODO: 실제 푸시 발송 로직 구현
        // 1. VAPID 방식: nl.martijndwars:web-push 라이브러리
        // 2. FCM 방식: Firebase Admin SDK
    }
}
```

### 5. SSE와 Web Push 통합

**SseEmitters.java 수정**:

```java
@Component
public class SseEmitters {

    @Autowired
    private WebPushService webPushService;

    /**
     * SSE 발송 실패 시 Web Push 폴백
     */
    public void send(String userId, String type, Object data) {
        boolean sseSent = sendViaSSE(userId, type, data);

        // SSE 전송 실패 시 Web Push 발송
        if (!sseSent) {
            sendViaWebPush(userId, type, data);
        }
    }

    private boolean sendViaSSE(String userId, String type, Object data) {
        // 기존 SSE 로직
        // ...
    }

    private void sendViaWebPush(String userId, String type, Object data) {
        String title = "Flayground 알림";
        String body = "새로운 업데이트가 있습니다.";

        // 타입별 메시지 커스터마이징
        switch (type) {
            case "notice":
                title = "공지사항";
                body = data.toString();
                break;
            case "message":
                title = "메시지";
                body = data.toString();
                break;
            // ...
        }

        Map<String, Object> pushData = new HashMap<>();
        pushData.put("type", type);
        pushData.put("timestamp", System.currentTimeMillis());
        pushData.put("url", "/dist/index.html");

        webPushService.sendNotification(userId, title, body, pushData);
    }
}
```

## 의존성 추가 (pom.xml)

```xml
<!-- Web Push 라이브러리 -->
<dependency>
    <groupId>nl.martijndwars</groupId>
    <artifactId>web-push</artifactId>
    <version>5.1.1</version>
</dependency>

<!-- Bouncy Castle (암호화) -->
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk15on</artifactId>
    <version>1.70</version>
</dependency>
```

또는 FCM 사용 시:

```xml
<!-- Firebase Admin SDK -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

## 사용 방법

### 프론트엔드

```typescript
// 알림 권한 요청 UI를 원하는 페이지에 추가
import "@ui/NotificationPermission";

// HTML에 추가
// <notification-permission></notification-permission>

// 또는 프로그래매틱하게 사용
import PushNotification from "@lib/PushNotification";

const push = PushNotification.getInstance();
await push.initialize();

// 알림 권한 요청
const granted = await push.requestPermission();

// 구독 생성
const subscription = await push.subscribe("YOUR_VAPID_PUBLIC_KEY");

// 테스트 알림
await push.showLocalNotification({
  title: "테스트",
  body: "알림이 작동합니다!",
});
```

### 백엔드

```java
// 특정 사용자에게 알림 발송
webPushService.sendNotification("user123", "새 메시지", "메시지가 도착했습니다.", data);

// 전체 브로드캐스트
webPushService.broadcast("공지사항", "시스템 점검 안내", data);
```

## 테스트 방법

1. **개발 서버 실행**: `yarn watch`
2. **브라우저에서 `/dist/index.html` 접속**
3. **알림 권한 요청 UI로 권한 허용**
4. **"알림 활성화" 버튼 클릭** (VAPID 키 필요)
5. **"테스트 알림" 버튼으로 로컬 알림 확인**
6. **백엔드에서 실제 푸시 발송 테스트**

## 주의사항

1. **VAPID 공개키 교체**: [NotificationPermission.ts](www/src/ui/NotificationPermission.ts#L109)의 `YOUR_VAPID_PUBLIC_KEY_HERE`를 실제 키로 변경
2. **HTTPS 필수**: Service Worker와 Push API는 HTTPS 환경 필요 (localhost는 예외)
3. **브라우저 호환성**: Chrome, Firefox, Edge, Safari 14+ 지원
4. **iOS 제약**: iOS Safari는 PWA로 홈 화면 추가 후에만 백그라운드 푸시 가능
5. **방화벽 설정**: FCM 사용 시 `fcm.googleapis.com` 허용 필요

## 다음 단계

- [ ] VAPID 키 생성 및 설정
- [ ] 백엔드 API 구현 (`/api/push/subscribe`, `/api/push/unsubscribe`)
- [ ] Web Push 발송 서비스 구현
- [ ] SSE와 Web Push 통합
- [ ] DMZ Squid Proxy 설정 (FCM 사용 시)
- [ ] 프로덕션 환경 테스트
