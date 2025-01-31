// 카운트다운 이벤트 상수 정의
export const EVENT_COUNTDOWN_START = 'countdown-start';
export const EVENT_COUNTDOWN_END = 'countdown-end';
export const EVENT_COUNTDOWN_RESET = 'countdown-reset';
export const EVENT_COUNTDOWN_PAUSE = 'countdown-pause';
export const EVENT_COUNTDOWN_RESUME = 'countdown-resume';
export const EVENT_COUNTDOWN_CHANGE = 'countdown-change';

/**
 * 카운트다운 타이머를 표시하는 커스텀 요소.
 *
 * @class Countdown
 * @extends {HTMLElement}
 * @private {HTMLElement} #circle - 카운트다운을 나타내는 원형 요소.
 * @private {number} #startTime - 카운트다운 시작 시간.
 * @private {number} #duration - 카운트다운 지속 시간(밀리초).
 * @private {number} #elapsedTime - 경과 시간.
 * @private {number} #animationFrame - 카운트다운 애니메이션 프레임 ID.
 * @private {boolean} #isPaused - 카운트다운이 일시 중지되었는지 여부.
 *
 * @method connectedCallback - 요소가 DOM에 추가될 때 호출됨.
 * @method disconnectedCallback - 요소가 DOM에서 제거될 때 호출됨.
 * @method start - 카운트다운 타이머를 시작함.
 * @param {number} seconds - 카운트다운 지속 시간(초).
 * @method reset - 카운트다운 타이머를 초기화함.
 * @method pause - 카운트다운 타이머를 일시 중지함.
 * @method resume - 카운트다운 타이머를 재개함.
 * @method #cancel - 애니메이션 프레임을 취소함.
 * @method #animate - 카운트다운 타이머를 애니메이션함.
 */
export class Countdown extends HTMLElement {
  #circle;
  #startTime;
  #duration;
  #elapsedTime;
  #animationFrame;
  #isPaused;
  #prevSeconds = -1;

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

    this.#circle = this.shadowRoot.querySelector('div');
    this.#isPaused = false;
    this.#elapsedTime = 0;
  }

  connectedCallback() {}

  disconnectedCallback() {
    this.#cancel();
  }

  start(seconds) {
    this.reset();
    this.dataset.seconds = seconds;
    this.#duration = seconds * 1000;
    this.#startTime = performance.now();
    this.#animate();
    this.dispatchEvent(new Event(EVENT_COUNTDOWN_START));
  }

  reset() {
    this.#cancel();
    this.#circle.style.transform = 'unset';
    this.#elapsedTime = 0;
    this.#isPaused = false;
    this.dispatchEvent(new Event(EVENT_COUNTDOWN_RESET));
  }

  pause() {
    if (!this.#isPaused) {
      this.#isPaused = true;
      this.#elapsedTime += performance.now() - this.#startTime;
      this.#cancel();
      this.dispatchEvent(new Event(EVENT_COUNTDOWN_PAUSE));
    }
  }

  resume() {
    if (this.#isPaused) {
      this.#isPaused = false;
      this.#startTime = performance.now();
      this.#animate();
      this.dispatchEvent(new Event(EVENT_COUNTDOWN_RESUME));
    }
  }

  #cancel() {
    cancelAnimationFrame(this.#animationFrame);
  }

  #animate() {
    const elapsed = performance.now() - this.#startTime + this.#elapsedTime;
    const progress = Math.min(elapsed / this.#duration, 1);
    const degrees = progress * 360;
    const seconds = Math.ceil((this.#duration - elapsed) / 1000);

    this.#circle.style.transform = `rotate(${degrees}deg)`;
    if (seconds !== this.#prevSeconds) {
      this.dataset.seconds = seconds;
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

export const EVENT_TIMER_START = 'timer-start';
export const EVENT_TIMER_END = 'timer-end';
export const EVENT_TIMER_TICK = 'timer-tick';

/**
 * 초를 입력받아 시간을 재주는 클래스.
 *
 * @class Timer
 * @extends {HTMLElement}
 * @private {number} #seconds - 타이머 시간(초).
 * @private {number} #intervalId - setInterval ID.
 *
 * @method connectedCallback - 요소가 DOM에 추가될 때 호출됨.
 * @method disconnectedCallback - 요소가 DOM에서 제거될 때 호출됨.
 * @method start - 타이머를 시작함.
 * @method stop - 타이머를 중지함.
 * @method #tick - 타이머의 매 초마다 호출됨.
 */
export class Timer extends HTMLElement {
  #seconds;
  #intervalId;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-size: 2em;
          text-align: center;
        }
      </style>
      <div id="time"></div>
    `;
    this.#seconds = 0;
    this.#intervalId = null;
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.stop();
  }

  start(seconds) {
    this.#seconds = seconds;
    this.stop();
    this.#intervalId = setInterval(() => this.#tick(), 1000);
    this.dispatchEvent(new Event(EVENT_TIMER_START));
  }

  stop() {
    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  #tick() {
    if (this.#seconds > 0) {
      this.#seconds--;
      this.render();
      this.dispatchEvent(new CustomEvent(EVENT_TIMER_TICK, { detail: { seconds: this.#seconds } }));
    } else {
      this.stop();
      this.dispatchEvent(new Event(EVENT_TIMER_END));
    }
  }

  render() {
    this.shadowRoot.getElementById('time').textContent = this.#seconds;
  }
}

customElements.define('simple-timer', Timer);
