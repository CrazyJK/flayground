/**
 * 서비스 워커 등록 및 관리
 * - 서비스 워커 등록
 * - 업데이트 확인 및 처리
 * - 메시지 수신 처리
 */

/**
 * 서비스 워커 등록 및 초기화
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Service Worker] Not supported in this browser');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[Service Worker] Registered successfully:', registration.scope);

        // 서비스 워커 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Service Worker] New version available. Refresh to update.');
                handleServiceWorkerUpdate(newWorker);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[Service Worker] Registration failed:', error);
      });

    // 서비스 워커 컨트롤러 변경 감지
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[Service Worker] Controller changed. Reloading page...');
      window.location.reload();
    });

    // 서비스 워커로부터 메시지 수신
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[Service Worker] Message received:', event.data);

      if (event.data?.type === 'NOTIFICATION_CLICK') {
        handleNotificationClick(event.data.data);
      }
    });
  });
}

/**
 * 서비스 워커 업데이트 처리
 * @param newWorker - 새로운 서비스 워커
 */
function handleServiceWorkerUpdate(newWorker: ServiceWorker): void {
  // 사용자에게 업데이트 알림 (선택적)
  if (confirm('새로운 버전이 있습니다. 페이지를 새로고침하시겠습니까?')) {
    newWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

/**
 * 알림 클릭 이벤트 처리
 * @param data - 알림 데이터
 */
function handleNotificationClick(data: unknown): void {
  console.log('[Service Worker] Notification clicked with data:', data);
  // TODO: 업무 팝업 실행 로직 추가
  // 예: 특정 페이지로 이동, 팝업 열기 등
}

/**
 * 서비스 워커 등록 해제
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('[Service Worker] Unregistered:', success);
      return success;
    }
    return true;
  } catch (error) {
    console.error('[Service Worker] Unregister failed:', error);
    return false;
  }
}

/**
 * 서비스 워커 상태 확인
 */
export async function getServiceWorkerStatus(): Promise<{
  supported: boolean;
  registered: boolean;
  controller: boolean;
}> {
  const supported = 'serviceWorker' in navigator;

  if (!supported) {
    return { supported: false, registered: false, controller: false };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const registered = !!registration;
  const controller = !!navigator.serviceWorker.controller;

  return { supported, registered, controller };
}

if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  // 서비스 워커로부터 메시지 수신
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📬 [Service Worker] Message received:', event.data);

    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      const data = event.data.data || {};
      console.log('🔔 [Service Worker] Notification clicked:', data);

      // 알림 클릭 시 업무 팝업 실행 (커스텀 이벤트 발생)
      if (data.action) {
        window.dispatchEvent(
          new CustomEvent('serviceWorkerNotification', {
            detail: data,
          })
        );
      }
    }
  });

  // SPA 페이지 (dist/index.html 등)에서
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // 백그라운드 업데이트 감지 시
    if (!confirm('앱이 업데이트되었습니다. 새로고침하시겠습니까?')) {
      return;
    }
    location.reload();
  });
}
