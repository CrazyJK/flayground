import GroundFlay from '@base/GroundFlay';
import FlayStorage from '@lib/FlayStorage';
import { STORAGE_KEY } from '@lib/UpdateMyPosition';
import './FlayMonitor.scss';

const MonitorBackgroundColor = 'lightgray';
const FlayBackgroundColor = 'orange';
const FlayBorderColor = 'orangered';

/** 모니터 좌표 정보 */
interface MonitorInfo {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** Window Management API ScreenDetailed 타입 선언 */
interface ScreenDetailed extends Screen {
  left: number;
  top: number;
}

/** Window Management API 타입 선언 */
interface ScreenDetails extends EventTarget {
  screens: ScreenDetailed[];
  addEventListener(type: 'screenschange', listener: () => void): void;
}

declare global {
  interface Window {
    getScreenDetails?: () => Promise<ScreenDetails>;
  }
}

/** 왼쪽부터 모니터 좌표 (fallback용 하드코딩 값) */
const FallbackMonitors: MonitorInfo[] = [
  { left: -2560, top: 71, right: -1, bottom: 1510, width: 2560, height: 1440 },
  { left: 0, top: 0, right: 1079, bottom: 1919, width: 1080, height: 1920 },
  { left: 1080, top: 60, right: 3639, bottom: 1499, width: 2560, height: 1440 },
  { left: 3640, top: -520, right: 5079, bottom: 2039, width: 1440, height: 2560 },
];

/** Flay 창의 위치 정보 */
interface FlayPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * 모니터에 창의 위치를 시각화하는 컴포넌트
 *
 * 여러 모니터에 분산된 창들의 위치를 캔버스에 그려서
 * 전체적인 레이아웃을 한눈에 볼 수 있게 해줍니다.
 */
export default class FlayMonitor extends GroundFlay {
  /** 현재 모니터 목록 */
  #monitors: MonitorInfo[] = FallbackMonitors;

  /** 전체 화면 영역의 왼쪽 좌표 */
  get left() {
    return Math.min(...this.#monitors.map((m) => m.left));
  }
  /** 전체 화면 영역의 위쪽 좌표 */
  get top() {
    return Math.min(...this.#monitors.map((m) => m.top));
  }
  /** 전체 화면 영역의 오른쪽 좌표 */
  get right() {
    return Math.max(...this.#monitors.map((m) => m.right));
  }
  /** 전체 화면 영역의 아래쪽 좌표 */
  get bottom() {
    return Math.max(...this.#monitors.map((m) => m.bottom));
  }
  /** 전체 화면 영역의 너비 */
  get width() {
    return this.right - this.left + 1;
  }
  /** 전체 화면 영역의 높이 */
  get height() {
    return this.bottom - this.top + 1;
  }

  constructor() {
    super();
    this.appendChild(document.createElement('canvas'));
  }

  connectedCallback() {
    // Permissions API로 현재 권한 상태 확인
    // - granted: 이미 허용 → 바로 실시간 모니터 조회
    // - prompt: 미허용 → 클릭 시 권한 요청 (Transient activation 필요)
    // - denied / 미지원: fallback 사용
    if (window.getScreenDetails) {
      navigator.permissions
        .query({ name: 'window-management' as PermissionName })
        .then((status) => {
          if (status.state === 'granted') {
            this.#initScreenDetails();
          } else if (status.state === 'prompt') {
            // 클릭 이벤트로 권한 요청 유도
            this.title = '클릭하여 실시간 모니터 정보 권한 요청';
            this.style.cursor = 'pointer';
            this.addEventListener(
              'click',
              () => {
                this.title = '';
                this.style.cursor = '';
                this.#initScreenDetails();
              },
              { once: true }
            );
            this.#applyMonitors(this.#monitors);
          } else {
            // denied면 fallback으로 유지
            this.#applyMonitors(this.#monitors);
          }
        })
        .catch(() => {
          // Permissions API 미지원 시 클릭으로 시도
          this.addEventListener('click', () => this.#initScreenDetails(), { once: true });
          this.#applyMonitors(this.#monitors);
        });
    } else {
      // getScreenDetails 미지원 시 fallback
      this.#applyMonitors(this.#monitors);
    }

    /** 스토리지를 통해서 창들의 위치를 그린다 */
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      this.#renderPosition(JSON.parse(e.newValue!));
    });
  }

  /** getScreenDetails를 호출하고 screenschange 이벤트를 등록합니다. */
  #initScreenDetails() {
    window.getScreenDetails!()
      .then((screenDetails) => {
        const monitors = screenDetails.screens.map((s) => ({ left: s.left, top: s.top, right: s.left + s.width - 1, bottom: s.top + s.height - 1, width: s.width, height: s.height })).sort((a, b) => a.left - b.left);
        this.#applyMonitors(monitors);

        screenDetails.addEventListener('screenschange', () => {
          const updated = screenDetails.screens.map((s) => ({ left: s.left, top: s.top, right: s.left + s.width - 1, bottom: s.top + s.height - 1, width: s.width, height: s.height })).sort((a, b) => a.left - b.left);
          this.#applyMonitors(updated);
        });
      })
      .catch((error) => console.warn('getScreenDetails 실패:', error));
  }

  /** 모니터 목록을 갱신하고 캔버스를 재구성합니다. */
  #applyMonitors(monitors: MonitorInfo[]) {
    this.#monitors = monitors;

    const canvas = this.querySelector('canvas')!;
    canvas.width = this.width;
    canvas.height = this.height;

    console.log(`screen
      (${this.left}, ${this.top})
          ▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦
          ▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦  ${this.height}
          ▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦
                            ${this.width}                   (${this.right}, ${this.bottom})
    `);

    // 초기 위치 정보 그리기
    this.#renderPosition(FlayStorage.local.getObject(STORAGE_KEY));
  }

  /**
   * 창들의 위치를 캔버스에 그립니다.
   * @param positionInfo 창 이름을 키로 하고 위치 정보를 값으로 하는 객체
   */
  #renderPosition(positionInfo: Record<string, FlayPosition>) {
    console.debug('renderPosition', positionInfo);
    this.#renderForeground();
    Object.entries(positionInfo).forEach(([key, position]) => this.#drawFlay(key, position));
    this.#removeBackground();
  }

  /** 모니터 배경을 그립니다. */
  #renderForeground() {
    const ctx = this.querySelector('canvas')!.getContext('2d')!;
    ctx.fillStyle = MonitorBackgroundColor;
    this.#monitors.forEach((monitor) => ctx.fillRect(this.#toX(monitor.left), this.#toY(monitor.top), monitor.width, monitor.height));
  }

  /** 모니터 영역 밖의 배경을 지웁니다. */
  #removeBackground() {
    const ctx = this.querySelector('canvas')!.getContext('2d')!;
    this.#monitors.forEach((monitor) => {
      ctx.clearRect(this.#toX(monitor.left), this.#toY(this.top), monitor.width, monitor.top - this.top);
      ctx.clearRect(this.#toX(monitor.left), this.#toY(monitor.bottom), monitor.width, this.bottom - monitor.bottom);
    });
  }

  /**
   * 캔버스를 이미지로 변환하여 URL을 반환합니다.
   * @returns 이미지 URL Promise
   */
  getImageURL() {
    return new Promise((resolve) => {
      this.querySelector('canvas')!.toBlob((blob) => resolve(URL.createObjectURL(blob!)), 'image/jpeg', 0.95);
    });
  }

  /**
   * 저장된 위치 정보를 모두 지우고 캔버스를 다시 그립니다.
   */
  clear() {
    // storage clear
    FlayStorage.local.setObject(STORAGE_KEY, {});
    this.#renderPosition({});
  }

  /**
   * 개별 Flay 창을 캔버스에 그립니다.
   * @param name 창의 이름
   * @param position 창의 위치와 크기 정보
   */
  #drawFlay(name: string, { left, top, width, height }: FlayPosition) {
    const ctx = this.querySelector('canvas')!.getContext('2d')!;
    const lineWidth = 20;
    const margin = 30;
    const [x, y] = [this.#toX(left), this.#toY(top)];

    // 사각 바탕
    ctx.fillStyle = FlayBackgroundColor;
    ctx.fillRect(x + margin, y + margin, width - margin * 2, height - margin * 2);

    // 사각 보더
    ctx.strokeStyle = FlayBorderColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + margin, y + margin); // left top
    ctx.lineTo(x + width - margin, y + margin); // right top
    ctx.lineTo(x + width - margin, y + height - margin); // right bottom
    ctx.lineTo(x + margin, y + height - margin); // left bottom
    ctx.lineTo(x + margin, y + margin);
    ctx.stroke();

    // 이름 쓰기
    ctx.font = `bold ${16 * 8}px D2Coding`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + width / 2, y + height / 2, width - margin * 2);
  }

  /**
   * 전역 좌표를 캔버스 X 좌표로 변환합니다.
   * @param left 전역 X 좌표
   * @returns 캔버스 X 좌표
   */
  #toX(left: number) {
    return left - this.left;
  }

  /**
   * 전역 좌표를 캔버스 Y 좌표로 변환합니다.
   * @param top 전역 Y 좌표
   * @returns 캔버스 Y 좌표
   */
  #toY(top: number) {
    return top - this.top;
  }
}

customElements.define('flay-monitor', FlayMonitor);
