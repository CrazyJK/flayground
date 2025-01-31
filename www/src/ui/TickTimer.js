// TickTimer 클래스에 일시정지, 재개 기능 추가

export const EVENT_TIMER_START = 'timer-start';
export const EVENT_TIMER_END = 'timer-end';
export const EVENT_TIMER_TICK = 'timer-tick';
export const EVENT_TIMER_PAUSE = 'timer-pause';
export const EVENT_TIMER_RESUME = 'timer-resume';

/**
 * 초를 입력받아 시간을 재주는 클래스.
 *
 * @class TickTimer
 * @extends {HTMLElement}
 * @private {number} #seconds - 타이머 시간(초).
 * @private {number} #intervalId - setInterval ID.
 * @private {boolean} #isPaused - 타이머 일시정지 상태.
 *
 * @method connectedCallback - 요소가 DOM에 추가될 때 호출됨.
 * @method disconnectedCallback - 요소가 DOM에서 제거될 때 호출됨.
 * @method start - 타이머를 시작함.
 * @method stop - 타이머를 중지함.
 * @method pause - 타이머를 일시정지함.
 * @method resume - 타이머를 재개함.
 * @method #tick - 타이머의 매 초마다 호출됨.
 */
export class TickTimer extends HTMLElement {
  #seconds;
  #intervalId;
  #isPaused;

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
    this.#isPaused = false;
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
    this.render();
    this.#intervalId = setInterval(() => this.#tick(), 1000);
    this.#isPaused = false;
    this.dispatchEvent(new Event(EVENT_TIMER_START));
  }

  stop() {
    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
    this.#isPaused = false;
  }

  pause() {
    if (this.#intervalId !== null && !this.#isPaused) {
      clearInterval(this.#intervalId);
      this.#isPaused = true;
      this.dispatchEvent(new Event(EVENT_TIMER_PAUSE));
    }
  }

  resume() {
    if (this.#isPaused) {
      this.#intervalId = setInterval(() => this.#tick(), 1000);
      this.#isPaused = false;
      this.dispatchEvent(new Event(EVENT_TIMER_RESUME));
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

customElements.define('tick-timer', TickTimer);
