export class Countdown extends HTMLElement {
  #willStop;
  #countdownCircle;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: relative;
          width: var(--size-large);
          height: var(--size-large);
          background: transparent;
        }
        div {
          width: 100%;
          height: 100%;
          background: conic-gradient(#fff, #000);
          /* border: 2px solid var(--color-border-window); */
          border-radius: 50%;
        }
      </style>
      <div></div>
    `;

    this.#willStop = false;
    this.#countdownCircle = this.shadowRoot.querySelector('div');
  }

  connectedCallback() {
    this.reset();
  }

  disconnectedCallback() {
    this.stop();
  }

  async start(seconds) {
    this.reset();
    const timeout = (seconds * 1000) / 360;

    this.#willStop = false;
    this.#countdownCircle.style.transition = `transform ${timeout}ms`;

    for (let i = 1; i <= 360; i++) {
      if (this.#willStop) break;
      this.#countdownCircle.style.transform = `rotate(${i}deg)`;

      await new Promise((resolve) => setTimeout(resolve, timeout));
    }
  }

  stop() {
    this.#willStop = true;
  }

  reset() {
    this.#willStop = true;
    this.#countdownCircle.style.transition = 'unset';
    this.#countdownCircle.style.transform = 'unset';
  }
}

customElements.define('count-down', Countdown);
