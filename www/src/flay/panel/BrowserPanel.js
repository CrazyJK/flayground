import FlayStorage from '../../lib/FlayStorage';

export default class BrowserPanel extends HTMLElement {
  #inputURL;
  #listURL;
  #frame;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-rows: auto 1fr;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--color-bg-transparent);
          overflow: hidden;
        }
        .url-bar input {
          width: 100%;
          padding: 0.5em;
          border: 0;
          background-color: var(--color-bg);
          color: var(--color-text);
        }
        .frame-wrap .frame {
          width: 100%;
          height: 100%;
          border: none;
        }
      </style>
      <div class="url-bar">
        <input type="url" list="url-list" placeholder="Enter URL"/>
        <datalist id="url-list">
      </div>
      <dib class="frame-wrap">
        <iframe class="frame"></iframe>
      </div>
    `;

    this.#inputURL = this.shadowRoot.querySelector('input');
    this.#listURL = this.shadowRoot.querySelector('#url-list');
    this.#frame = this.shadowRoot.querySelector('.frame');
  }

  connectedCallback() {
    this.#inputURL.addEventListener('keyup', (e) => {
      if (e.key !== 'Enter') return;
      this.#frame.src = e.target.value;
      this.#addDatalist(e.target.value);
      this.#saveDatalist();
    });

    this.#loadDatalist();
  }

  #addDatalist(url) {
    this.#listURL.querySelector(`option[value="${url}"]`)?.remove();

    const option = document.createElement('option');
    option.value = url;
    this.#listURL.prepend(option);

    this.#listURL.querySelectorAll('option').forEach((option, i) => i > 30 && option.remove());
  }

  #loadDatalist() {
    const urls = FlayStorage.local.getArray('urls');
    urls.forEach((url) => this.#addDatalist(url));
  }

  #saveDatalist() {
    const urls = Array.from(this.#listURL.querySelectorAll('option')).map((option) => option.value);
    FlayStorage.local.setArray('urls', urls);
  }
}

customElements.define('browser-panel', BrowserPanel);
