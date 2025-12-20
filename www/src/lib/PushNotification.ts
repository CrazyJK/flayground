/**
 * Web Push 알림 관리 클래스
 * - 알림 권한 요청
 * - 구독 정보 관리
 * - 서버와 구독 정보 동기화
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

/**
 * Push 알림 관리 클래스
 */
export default class PushNotification {
  // VAPID 공개키 (서버 application.properties의 webpush.vapid.public-key와 동일)
  private static readonly VAPID_PUBLIC_KEY = 'BFffI3DQ4gemRBWy7lULPPrrP2Fy1v-HCIlLEmMsiRI1YHR1g06Grzdm4r_OK7W1lkgwo5un2HpPoLxfLvWd5NQ';

  private static instance: PushNotification | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): PushNotification {
    if (!PushNotification.instance) {
      PushNotification.instance = new PushNotification();
    }
    return PushNotification.instance;
  }

  private constructor() {}

  /**
   * 서비스 워커 등록 상태 확인 및 저장
   */
  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    if (!('PushManager' in window)) {
      throw new Error('Push API not supported');
    }

    this.registration = await navigator.serviceWorker.ready;
    console.log('[PushNotification] Initialized with registration:', this.registration);
  }

  /**
   * 알림 권한 상태 확인
   */
  getPermission(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * 알림 권한이 있는지 확인
   */
  hasPermission(): boolean {
    return Notification.permission === 'granted';
  }

  /**
   * 알림 권한 요청
   * @returns 권한 허용 여부
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[PushNotification] Notification API not supported');
      return false;
    }

    if (this.hasPermission()) {
      return true;
    }

    const permission = await Notification.requestPermission();
    console.log('[PushNotification] Permission result:', permission);

    return permission === 'granted';
  }

  /**
   * Push 구독 생성
   * @param vapidPublicKey - VAPID 공개키 (Base64 URL-safe 형식). 생략 시 기본값 사용
   * @returns 구독 정보
   */
  async subscribe(vapidPublicKey: string = PushNotification.VAPID_PUBLIC_KEY): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service Worker registration not found');
    }

    try {
      // 기존 구독 확인
      let subscription = await this.registration.pushManager.getSubscription();

      // 구독이 없으면 새로 생성
      if (!subscription) {
        const convertedKey = this.urlBase64ToUint8Array(vapidPublicKey);
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey as BufferSource,
        });
        console.log('[PushNotification] New subscription created:', subscription);
      }

      // 구독 정보 변환
      const subscriptionData = this.convertSubscription(subscription);

      // 서버에 구독 정보 전송
      await this.sendSubscriptionToServer(subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('[PushNotification] Subscribe failed:', error);
      return null;
    }
  }

  /**
   * Push 구독 해제
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        const subscriptionData = this.convertSubscription(subscription);

        // 서버에서 구독 정보 삭제
        await this.removeSubscriptionFromServer(subscriptionData);

        // 브라우저에서 구독 해제
        const success = await subscription.unsubscribe();
        console.log('[PushNotification] Unsubscribed:', success);
        return success;
      }
      return true;
    } catch (error) {
      console.error('[PushNotification] Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * 현재 구독 정보 조회
   */
  async getSubscription(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return null;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return subscription ? this.convertSubscription(subscription) : null;
  }

  /**
   * PushSubscription을 JSON 형식으로 변환
   */
  private convertSubscription(subscription: PushSubscription): PushSubscriptionData {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: key ? this.arrayBufferToBase64(key) : '',
        auth: auth ? this.arrayBufferToBase64(auth) : '',
      },
    };
  }

  /**
   * Base64 URL-safe 문자열을 Uint8Array로 변환
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * ArrayBuffer를 Base64 문자열로 변환
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return window.btoa(binary);
  }

  /**
   * 구독 정보를 서버에 전송
   */
  private async sendSubscriptionToServer(subscription: PushSubscriptionData): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('[PushNotification] Subscription sent to server');
    } catch (error) {
      console.error('[PushNotification] Failed to send subscription to server:', error);
      throw error;
    }
  }

  /**
   * 서버에서 구독 정보 삭제
   */
  private async removeSubscriptionFromServer(subscription: PushSubscriptionData): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('[PushNotification] Subscription removed from server');
    } catch (error) {
      console.error('[PushNotification] Failed to remove subscription from server:', error);
      throw error;
    }
  }

  /**
   * 로컬 알림 표시 (테스트용)
   */
  async showLocalNotification(options: NotificationOptions): Promise<void> {
    if (!this.hasPermission()) {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('[PushNotification] Permission denied');
        return;
      }
    }

    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service Worker registration not found');
    }

    await this.registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon ?? '/dist/favicon/flay.png',
      badge: options.badge ?? '/dist/favicon/flay.png',
      data: options.data,
      requireInteraction: false,
      vibrate: [200, 100, 200],
    } as unknown as NotificationOptions);
  }
}
