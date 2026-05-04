import PushNotification from '@lib/browser/PushNotification';
import { showAlert } from '@lib/components/showAlert';
import './NotificationPermission.scss';

/**
 * Web Push 알림 권한 요청 UI 컴포넌트
 * - 사용자에게 알림 권한 요청
 * - 구독 상태 표시 및 관리
 */
export class NotificationPermission extends HTMLElement {
  private pushNotification: PushNotification;
  private statusElement: HTMLElement | null = null;
  private enableButton: HTMLButtonElement | null = null;
  private disableButton: HTMLButtonElement | null = null;

  constructor() {
    super();
    this.pushNotification = PushNotification.getInstance();
  }

  connectedCallback(): void {
    this.render();
    this.attachEventListeners();
    void this.updateStatus();
  }

  private render(): void {
    this.innerHTML = `
      <div class="notification-permission">
        <div class="notification-permission__header">
          <h3>🔔 Push 알림 설정</h3>
        </div>
        <div class="notification-permission__content">
          <p class="notification-permission__description">
            브라우저가 닫혀 있어도 중요한 알림을 받을 수 있습니다.
          </p>
          <div class="notification-permission__status">
            <span class="notification-permission__status-label">상태:</span>
            <span class="notification-permission__status-value" id="notification-status">확인 중...</span>
          </div>
          <div class="notification-permission__actions">
            <button class="notification-permission__button notification-permission__button--enable" id="enable-notification">
              알림 활성화
            </button>
            <button class="notification-permission__button notification-permission__button--disable" id="disable-notification" style="display: none;">
              알림 비활성화
            </button>
            <button class="notification-permission__button notification-permission__button--test" id="test-notification" style="display: none;">
              테스트 알림
            </button>
          </div>
        </div>
      </div>
    `;

    this.statusElement = this.querySelector('#notification-status');
    this.enableButton = this.querySelector('#enable-notification');
    this.disableButton = this.querySelector('#disable-notification');
  }

  private attachEventListeners(): void {
    this.enableButton?.addEventListener('click', () => this.handleEnable());
    this.disableButton?.addEventListener('click', () => this.handleDisable());
    this.querySelector('#test-notification')?.addEventListener('click', () => this.handleTest());
  }

  private async updateStatus(): Promise<void> {
    try {
      await this.pushNotification.initialize();
      const permission = this.pushNotification.getPermission();
      const subscription = await this.pushNotification.getSubscription();

      if (!this.statusElement || !this.enableButton || !this.disableButton) return;

      if (permission === 'granted' && subscription) {
        this.statusElement.textContent = '✅ 활성화됨';
        this.statusElement.className = 'notification-permission__status-value notification-permission__status-value--granted';
        this.enableButton.style.display = 'none';
        this.disableButton.style.display = 'inline-block';
        this.querySelector<HTMLButtonElement>('#test-notification')!.style.display = 'inline-block';
      } else if (permission === 'denied') {
        this.statusElement.textContent = '❌ 차단됨 (브라우저 설정에서 변경 필요)';
        this.statusElement.className = 'notification-permission__status-value notification-permission__status-value--denied';
        this.enableButton.style.display = 'none';
        this.disableButton.style.display = 'none';
      } else {
        this.statusElement.textContent = '⚪ 비활성화됨';
        this.statusElement.className = 'notification-permission__status-value notification-permission__status-value--default';
        this.enableButton.style.display = 'inline-block';
        this.disableButton.style.display = 'none';
      }
    } catch (error) {
      console.error('[NotificationPermission] Failed to update status:', error);
      if (this.statusElement) {
        this.statusElement.textContent = '⚠️ 지원되지 않음';
        this.statusElement.className = 'notification-permission__status-value notification-permission__status-value--error';
      }
    }
  }

  private async handleEnable(): Promise<void> {
    try {
      const granted = await this.pushNotification.requestPermission();

      if (!granted) {
        await showAlert('알림 권한이 거부되었습니다.');
        await this.updateStatus();
        return;
      }

      // VAPID 공개키는 PushNotification 클래스 내부에서 자동으로 사용
      const subscription = await this.pushNotification.subscribe();

      if (subscription) {
        await showAlert('Push 알림이 활성화되었습니다.');
        await this.updateStatus();
      } else {
        await showAlert('Push 알림 구독에 실패했습니다.', '오류');
      }
    } catch (error) {
      console.error('[NotificationPermission] Enable failed:', error);
      await showAlert('알림 활성화 중 오류가 발생했습니다.', '오류');
    }
  }

  private async handleDisable(): Promise<void> {
    try {
      const success = await this.pushNotification.unsubscribe();

      if (success) {
        await showAlert('Push 알림이 비활성화되었습니다.');
        await this.updateStatus();
      } else {
        await showAlert('알림 비활성화에 실패했습니다.', '오류');
      }
    } catch (error) {
      console.error('[NotificationPermission] Disable failed:', error);
      await showAlert('알림 비활성화 중 오류가 발생했습니다.', '오류');
    }
  }

  private async handleTest(): Promise<void> {
    try {
      await this.pushNotification.showLocalNotification({
        title: 'Flayground 테스트 알림',
        body: '알림이 정상적으로 작동하고 있습니다! 🎉',
        data: {
          url: '/dist/index.html',
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error('[NotificationPermission] Test notification failed:', error);
      await showAlert('테스트 알림 표시에 실패했습니다.', '오류');
    }
  }
}

customElements.define('notification-permission', NotificationPermission);
