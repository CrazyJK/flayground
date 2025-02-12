export const EVENT_TIMER_START = 'timer-start';
export const EVENT_TIMER_END = 'timer-end';
export const EVENT_TIMER_TICK = 'timer-tick';
export const EVENT_TIMER_PAUSE = 'timer-pause';
export const EVENT_TIMER_RESUME = 'timer-resume';

/**
 * 타이머 컴포넌트
 * @extends HTMLElement
 */
export class TickTimer extends HTMLElement {
  #seconds = 0;
  #intervalId = null;
  #isPaused = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: relative;
          display: block;
          font-size: var(--size-large);
        }
        div {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      </style>
      <div id="time"></div>`;
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.stop();
  }

  /**
   * 타이머를 시작합니다.
   * @param {number} seconds 시작할 초
   */
  start(seconds) {
    this.#seconds = seconds;
    this.stop();
    this.render();
    this.#intervalId = setInterval(() => this.#tick(), 1000);
    this.#isPaused = false;
    this.dispatchEvent(new Event(EVENT_TIMER_START));
  }

  /**
   * 타이머를 중지합니다.
   */
  stop() {
    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
      this.dispatchEvent(new Event(EVENT_TIMER_END));
    }
    this.#isPaused = false;
  }

  /**
   * 타이머를 일시정지합니다.
   */
  pause() {
    if (this.#intervalId !== null && !this.#isPaused) {
      clearInterval(this.#intervalId);
      this.#isPaused = true;
      this.dispatchEvent(new Event(EVENT_TIMER_PAUSE));
    }
  }

  /**
   * 타이머를 재개합니다
   */
  resume() {
    if (this.#isPaused) {
      this.#intervalId = setInterval(() => this.#tick(), 1000);
      this.#isPaused = false;
      this.dispatchEvent(new Event(EVENT_TIMER_RESUME));
    }
  }

  /**
   * 타이머를 일시정지 또는 재개합니다.
   * @returns {boolean} 상태. 재개 상태이면 true, 아니면 false
   */
  toggle() {
    if (this.#isPaused) {
      this.resume();
    } else {
      this.pause();
    }
    return !this.#isPaused;
  }

  /**
   * 1초마다 호출되는 콜백 함수
   */
  #tick() {
    if (this.#seconds > 0) {
      this.#seconds--;
      this.render();
      this.dispatchEvent(new CustomEvent(EVENT_TIMER_TICK, { detail: { seconds: this.#seconds } }));
    } else {
      this.stop();
    }
  }

  /**
   * 화면을 렌더링합니다.
   */
  render() {
    this.shadowRoot.getElementById('time').textContent = this.#seconds;
  }
}

customElements.define('tick-timer', TickTimer);
