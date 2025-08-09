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
export class Countdown extends HTMLElement {
  #circle: HTMLDivElement;
  #startTime: number;
  #duration: number;
  #elapsedTime: number;
  #animationFrame: number;
  #isPaused: boolean;
  #prevSeconds: number = -1;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: var(--size-large);
          height: var(--size-large);
          background: transparent;
        }
        div {
          width: 100%;
          height: 100%;
          background: conic-gradient(#fff, #000);
          border-radius: 50%;
          transition: unset;
        }
      </style>
      <div></div>
    `;

    this.#circle = this.shadowRoot.querySelector('div') as HTMLDivElement;
    this.#isPaused = false;
    this.#elapsedTime = 0;
  }

  connectedCallback() {}

  disconnectedCallback() {
    this.#cancel();
  }

  /**
   * 카운트다운을 시작합니다.
   *
   * @param seconds - 카운트다운할 초 수
   * @example
   * ```typescript
   * countdown.start(30); // 30초 카운트다운 시작
   * ```
   */
  start(seconds: number): void {
    this.reset();
    this.dataset.seconds = seconds.toString();
    this.#duration = seconds * 1000;
    this.#startTime = performance.now();
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
    this.#circle.style.transform = 'unset';
    this.#elapsedTime = 0;
    this.#isPaused = false;
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
    if (!this.#isPaused) {
      this.#isPaused = true;
      this.#elapsedTime += performance.now() - this.#startTime;
      this.#cancel();
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
    if (this.#isPaused) {
      this.#isPaused = false;
      this.#startTime = performance.now();
      this.#animate();
      this.dispatchEvent(new Event(EVENT_COUNTDOWN_RESUME));
    }
  }

  /**
   * 현재 실행 중인 애니메이션 프레임을 취소합니다.
   * @private
   */
  #cancel(): void {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
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

    this.#circle.style.transform = `rotate(${degrees}deg)`;
    if (seconds !== this.#prevSeconds) {
      this.dataset.seconds = seconds.toString();
      this.dispatchEvent(new CustomEvent(EVENT_COUNTDOWN_CHANGE, { detail: { seconds } }));
      this.#prevSeconds = seconds;
    }

    if (progress < 1) {
      this.#animationFrame = requestAnimationFrame(() => this.#animate());
    } else {
      this.dispatchEvent(new Event(EVENT_COUNTDOWN_END));
    }
  }
}

customElements.define('count-down', Countdown);
