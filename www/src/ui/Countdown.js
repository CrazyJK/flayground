export class Countdown extends HTMLElement {
  #circle;
  #timer = -1;

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
          /* border: 2px solid var(--color-border-window); */
          border-radius: 50%;
        }
      </style>
      <div></div>
    `;

    this.#circle = this.shadowRoot.querySelector('div');
  }

  connectedCallback() {
    this.reset();
  }

  disconnectedCallback() {
    this.stop();
  }

  start(seconds) {
    this.reset();

    const timeout = (seconds * 1000) / 360;
    let i = 1;

    this.#circle.style.transition = `transform ${timeout}ms`;
    this.#timer = setInterval(() => {
      if (i > 360) {
        this.stop();
        return;
      }

      this.#circle.style.transform = `rotate(${i}deg)`;
      i++;
    }, timeout);
  }

  stop() {
    clearInterval(this.#timer);
  }

  reset() {
    this.stop();
    this.#circle.style.transition = 'unset';
    this.#circle.style.transform = 'unset';
  }
}

customElements.define('count-down', Countdown);
