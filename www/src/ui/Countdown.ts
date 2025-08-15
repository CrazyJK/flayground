import FlayDiv from '@flay/FlayDiv';

// 카운트다운 이벤트 상수 정의

/** 카운트다운이 시작될 때 발생하는 이벤트 타입 */
export const EVENT_COUNTDOWN_START = 'countdown-start';

/** 카운트다운이 종료될 때 발생하는 이벤트 타입 */
export const EVENT_COUNTDOWN_END = 'countdown-end';

/** 카운트다운이 리셋될 때 발생하는 이벤트 타입 */
export const EVENT_COUNTDOWN_RESET = 'countdown-reset';

/** 카운트다운이 일시정지될 때 발생하는 이벤트 타입 */
export const EVENT_COUNTDOWN_PAUSE = 'countdown-pause';

/** 카운트다운이 재개될 때 발생하는 이벤트 타입 */
export const EVENT_COUNTDOWN_RESUME = 'countdown-resume';

/** 카운트다운 상태를 나타내는 열거형 */
export enum CountdownState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

/** 카운트다운 설정 옵션 */
export interface CountdownOptions {
  /** 카운트다운 색상 (기본: #fff) */
  color?: string;
  /** 배경 색상 (기본: #000) */
  backgroundColor?: string;
  /** 애니메이션 지속시간 (기본: 60fps) */
  fps?: number;
}

/** 카운트다운 초가 변경될 때 발생하는 이벤트 타입 */
export const EVENT_COUNTDOWN_CHANGE = 'countdown-change';

/**
 * 카운트다운 타이머를 표시하는 커스텀 요소입니다.
 *
 * 원형 진행 바와 함께 초 단위로 카운트다운을 수행하며,
 * 시작, 정지, 재개, 리셋 기능을 제공합니다.
 *
 * @example
 * ```typescript
 * const countdown = document.createElement('count-down') as Countdown;
 * countdown.start(10); // 10초 카운트다운 시작
 * ```
 *
 * @fires Countdown#countdown-start - 카운트다운이 시작될 때 발생
 * @fires Countdown#countdown-end - 카운트다운이 종료될 때 발생
 * @fires Countdown#countdown-reset - 카운트다운이 리셋될 때 발생
 * @fires Countdown#countdown-pause - 카운트다운이 일시정지될 때 발생
 * @fires Countdown#countdown-resume - 카운트다운이 재개될 때 발생
 * @fires Countdown#countdown-change - 카운트다운 초가 변경될 때 발생
 */
export class Countdown extends FlayDiv {
  #circle: HTMLDivElement;
  #startTime: number = -1;
  #duration: number = -1;
  #elapsedTime: number = -1;
  #animationFrame: number | null = null;
  #isPaused: boolean = false;
  #prevSeconds: number = -1;
  #state: CountdownState = CountdownState.IDLE;
  #options: CountdownOptions;

  constructor(options: CountdownOptions = {}) {
    super();

    // 기본 옵션과 사용자 옵션 병합
    this.#options = {
      color: '#fff',
      backgroundColor: '#000',
      fps: 60,
      ...options,
    };

    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: var(--size-large);
          height: var(--size-large);
          background: transparent;
          /* 성능 최적화를 위한 will-change */
          will-change: transform;
        }
        div {
          width: 100%;
          height: 100%;
          background: conic-gradient(${this.#options.color}, ${this.#options.backgroundColor});
          border-radius: 50%;
          transition: unset;
          /* GPU 가속을 위한 transform3d 사용 준비 */
          transform-origin: center;
          will-change: transform;
        }
        /* 접근성 개선 */
        :host([aria-hidden="false"]) {
          position: relative;
        }
        :host([aria-hidden="false"])::after {
          content: attr(aria-label);
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
      </style>
      <div role="timer" aria-live="polite"></div>
    `;

    this.#circle = this.shadowRoot!.querySelector('div') as HTMLDivElement;
    this.#isPaused = false;
    this.#elapsedTime = 0;
    this.#state = CountdownState.IDLE;

    // 접근성 초기 설정
    this.setAttribute('role', 'timer');
    this.setAttribute('aria-live', 'polite');
  }

  connectedCallback() {}

  disconnectedCallback() {
    this.#cancel();
  }

  /**
   * 카운트다운을 시작합니다.
   *
   * @param seconds - 카운트다운할 초 수 (양수)
   * @throws {Error} seconds가 0보다 작거나 유한하지 않은 경우
   * @example
   * ```typescript
   * countdown.start(30); // 30초 카운트다운 시작
   * ```
   */
  start(seconds: number): void {
    // 입력 유효성 검사
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error('seconds must be a positive finite number');
    }

    this.reset();
    this.#state = CountdownState.RUNNING;
    this.dataset.seconds = seconds.toString();
    this.#duration = seconds * 1000;
    this.#startTime = performance.now();

    // 접근성 업데이트
    this.setAttribute('aria-label', `${seconds}초 카운트다운 시작`);

    this.#animate();
    this.dispatchEvent(new Event(EVENT_COUNTDOWN_START));
  }

  /**
   * 카운트다운을 초기화하고 정지합니다.
   *
   * @example
   * ```typescript
   * countdown.reset(); // 카운트다운을 0으로 초기화
   * ```
   */
  reset(): void {
    this.#cancel();
    this.#circle.style.transform = '';
    this.#elapsedTime = 0;
    this.#isPaused = false;
    this.#state = CountdownState.IDLE;
    this.#prevSeconds = -1;

    // 접근성 업데이트
    this.setAttribute('aria-label', '카운트다운 리셋됨');

    this.dispatchEvent(new Event(EVENT_COUNTDOWN_RESET));
  }

  /**
   * 실행 중인 카운트다운을 일시정지합니다.
   *
   * @example
   * ```typescript
   * countdown.pause(); // 카운트다운 일시정지
   * ```
   */
  pause(): void {
    if (!this.#isPaused && this.#state === CountdownState.RUNNING) {
      this.#isPaused = true;
      this.#state = CountdownState.PAUSED;
      this.#elapsedTime += performance.now() - this.#startTime;
      this.#cancel();

      // 접근성 업데이트
      this.setAttribute('aria-label', '카운트다운 일시정지됨');

      this.dispatchEvent(new Event(EVENT_COUNTDOWN_PAUSE));
    }
  }

  /**
   * 일시정지된 카운트다운을 재개합니다.
   *
   * @example
   * ```typescript
   * countdown.resume(); // 카운트다운 재개
   * ```
   */
  resume(): void {
    if (this.#isPaused && this.#state === CountdownState.PAUSED) {
      this.#isPaused = false;
      this.#state = CountdownState.RUNNING;
      this.#startTime = performance.now();

      // 접근성 업데이트
      this.setAttribute('aria-label', '카운트다운 재개됨');

      this.#animate();
      this.dispatchEvent(new Event(EVENT_COUNTDOWN_RESUME));
    }
  }

  /**
   * 현재 실행 중인 애니메이션 프레임을 취소합니다.
   * @private
   */
  #cancel(): void {
    if (this.#animationFrame !== null) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }
  }

  /**
   * 카운트다운 애니메이션을 처리합니다.
   *
   * 경과 시간을 계산하고 원형 진행 바를 업데이트하며,
   * 남은 초를 계산하여 이벤트를 발생시킵니다.
   * @private
   */
  #animate(): void {
    const elapsed = performance.now() - this.#startTime + this.#elapsedTime;
    const progress = Math.min(elapsed / this.#duration, 1);
    const degrees = progress * 360;
    const seconds = Math.ceil((this.#duration - elapsed) / 1000);

    // 성능 최적화: GPU 가속을 위한 transform3d 사용
    this.#circle.style.transform = `rotate3d(0, 0, 1, ${degrees}deg)`;

    if (seconds !== this.#prevSeconds) {
      this.dataset.seconds = seconds.toString();

      // 접근성 업데이트
      this.setAttribute('aria-label', `${seconds}초 남음`);

      this.dispatchEvent(
        new CustomEvent(EVENT_COUNTDOWN_CHANGE, {
          detail: { seconds, progress },
        })
      );
      this.#prevSeconds = seconds;
    }

    if (progress < 1) {
      this.#animationFrame = requestAnimationFrame(() => this.#animate());
    } else {
      this.#state = CountdownState.COMPLETED;
      this.setAttribute('aria-label', '카운트다운 완료');
      this.dispatchEvent(new Event(EVENT_COUNTDOWN_END));
    }
  }

  /**
   * 현재 카운트다운 상태를 반환합니다.
   */
  get state(): CountdownState {
    return this.#state;
  }

  /**
   * 남은 시간(밀리초)을 반환합니다.
   */
  get remainingTime(): number {
    if (this.#state === CountdownState.IDLE || this.#state === CountdownState.COMPLETED) {
      return 0;
    }

    const elapsed = this.#isPaused ? this.#elapsedTime : performance.now() - this.#startTime + this.#elapsedTime;

    return Math.max(0, this.#duration - elapsed);
  }

  /**
   * 진행률(0~1)을 반환합니다.
   */
  get progress(): number {
    if (this.#duration === 0) return 0;

    const elapsed = this.#isPaused ? this.#elapsedTime : performance.now() - this.#startTime + this.#elapsedTime;

    return Math.min(elapsed / this.#duration, 1);
  }
}

customElements.define('count-down', Countdown);
