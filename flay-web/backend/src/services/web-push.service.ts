import webpush from 'web-push';
import { config } from '../config';
import { pushSubscriptionRepo } from '../sources/push-subscription-repo';

/**
 * Web Push 알림 서비스.
 * Java WebPushService 대응 - VAPID 기반 Web Push 알림 발송
 */

let initialized = false;

/**
 * VAPID 키를 설정하여 web-push 라이브러리를 초기화한다.
 */
export function initWebPush(): void {
  const { publicKey, privateKey, subject } = config.webPush;

  if (!publicKey || !privateKey) {
    console.warn('[WebPush] VAPID 키가 설정되지 않았습니다. Web Push가 비활성화됩니다.');
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
  console.log(`[WebPush] 초기화 완료 (subject: ${subject})`);
}

/**
 * VAPID 공개키를 반환한다.
 */
export function getVapidPublicKey(): string {
  return config.webPush.publicKey || '';
}

/**
 * 특정 사용자에게 Push 알림을 발송한다.
 */
export function sendNotification(userId: string, title: string, body: string, data?: Record<string, unknown>): void {
  if (!initialized) return;

  const subscriptions = pushSubscriptionRepo.findByUserId(userId);
  if (subscriptions.length === 0) return;

  for (const sub of subscriptions) {
    sendPushMessage(sub, title, body, data);
  }
}

/**
 * 모든 구독자에게 브로드캐스트 알림을 발송한다.
 * Java WebPushService.broadcast() 대응
 */
export function broadcast(title: string, body: string, data?: Record<string, unknown>): void {
  if (!initialized) return;

  const allSubscriptions = pushSubscriptionRepo.findAll();
  if (allSubscriptions.length === 0) return;

  console.log(`[WebPush] 브로드캐스트: ${allSubscriptions.length}개 구독에 발송`);

  for (const sub of allSubscriptions) {
    sendPushMessage(sub, title, body, data);
  }
}

/**
 * 개별 구독에 Push 메시지를 전송한다.
 */
function sendPushMessage(subscription: { endpoint: string; p256dh: string; auth: string }, title: string, body: string, data?: Record<string, unknown>): void {
  const payload = JSON.stringify({
    title,
    body,
    icon: '/dist/favicon/flay.png',
    ...(data ? { data } : {}),
  });

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  webpush.sendNotification(pushSubscription, payload).catch((err: any) => {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // 구독 만료 → 삭제
      pushSubscriptionRepo.deleteByEndpoint(subscription.endpoint);
      console.log(`[WebPush] 만료된 구독 삭제: ${subscription.endpoint.substring(0, 50)}...`);
    } else {
      console.error(`[WebPush] 발송 실패 (${err.statusCode}): ${err.message}`);
    }
  });
}
