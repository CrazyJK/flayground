/**
 * Flayground Service Worker
 * - Web Push 알림 처리
 */

/**
 * 서비스 워커 설치 이벤트
 */
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  // 새 서비스 워커 즉시 활성화
  self.skipWaiting();
});

/**
 * 서비스 워커 활성화 이벤트
 */
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  // 모든 클라이언트 즉시 제어
  return self.clients.claim();
});

/**
 * Push 알림 수신 이벤트
 * FCM에서 전송된 알림 표시
 */
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);
  console.log("[Service Worker] Push data:", event.data);

  const defaultOptions = {
    icon: "/dist/favicon/flay.png",
    badge: "/dist/favicon/flay.png",
    vibrate: [200, 100, 200],
    requireInteraction: true, // 사용자가 클릭할 때까지 유지
    silent: false, // 소리 활성화
    tag: "flayground-notification", // 알림 그룹화 및 센터에 기록
  };

  let notificationData = {
    title: "Flayground 알림",
    body: "새로운 알림이 도착했습니다.",
    ...defaultOptions,
  };

  // Push 데이터 파싱
  if (event.data) {
    try {
      const data = event.data.json();
      console.log("[Service Worker] Parsed push data:", data);

      notificationData = {
        ...defaultOptions,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || defaultOptions.icon,
        badge: data.badge || defaultOptions.badge,
      };
      // data 속성 별도 처리
      if (data.data) {
        notificationData.data = data.data;
      }
    } catch (error) {
      console.error("[Service Worker] Failed to parse push data:", error);
      console.log("[Service Worker] Raw push data text:", event.data.text());
      notificationData.body = event.data.text();
    }
  } else {
    console.warn("[Service Worker] No push data received");
  }

  console.log("[Service Worker] Showing notification:", notificationData);

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationData)
      .then(() =>
        console.log("[Service Worker] Notification shown successfully"),
      )
      .catch((error) =>
        console.error("[Service Worker] Failed to show notification:", error),
      ),
  );
});

/**
 * 알림 클릭 이벤트
 * 알림 클릭 시 적절한 페이지로 이동
 */
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dist/index.html";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes("/dist/") && "focus" in client) {
            await client.focus();
            // 페이지에 메시지 전송
            client.postMessage({
              type: "NOTIFICATION_CLICK",
              data: event.notification.data,
            });
            return;
          }
        }
        // 열린 창이 없으면 새 창 열기
        if (self.clients.openWindow) {
          await self.clients.openWindow(urlToOpen);
        }
      }),
  );
});

/**
 * Background Sync 이벤트
 * 네트워크 복구 시 자동 재시도
 */
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync:", event.tag);

  if (event.tag === "sync-data") {
    event.waitUntil(
      // 동기화 로직 (나중에 구현)
      Promise.resolve(),
    );
  }
});

/**
 * 메시지 수신 이벤트
 * 클라이언트(페이지)로부터 메시지 처리
 */
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message received:", event.data);

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
