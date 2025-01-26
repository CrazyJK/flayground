import { EVENT_CHANGE_TITLE } from '../../GroundConstant';
import FlayStorage from '../../lib/FlayStorage';

export default class BrowserPanel extends HTMLElement {
  #input;
  #datalist;
  #iframe;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: absolute;
          inset: 0;
          background-color: var(--color-bg-transparent);
          overflow: hidden;
        }
        iframe {
          position: absolute;
          width: 100%;
          height: 100%;
          border: none;
        }
        .url-bar {
          position: absolute;
          top: 0;
          width: 100%;
          opacity: 0;
        }
        .url-bar:focus-within, .url-bar:hover {
          opacity: 1;
        }
        .url-bar input {
          display: block;
          width: 100%;
          padding: 0.5em;
          border: 0;
          background-color: var(--color-bg);
          color: var(--color-text);
        }
      </style>
      <iframe></iframe>
      <div class="url-bar">
        <input type="url" list="url-list" placeholder="Enter URL"/>
        <datalist id="url-list">
      </div>
    `;

    this.#input = this.shadowRoot.querySelector('input');
    this.#datalist = this.shadowRoot.querySelector('#url-list');
    this.#iframe = this.shadowRoot.querySelector('iframe');

    this.#input.addEventListener('keyup', (e) => {
      if (e.key !== 'Enter') return;
      const url = e.target.value.trim();
      if (url === '') return;

      this.#iframe.src = url;
      this.#addDatalist(url);
      this.#saveDatalist();
    });

    this.#iframe.addEventListener('load', () => {
      try {
        const title = new URL(this.#iframe.src).host + ' ' + this.#iframe.src.split('/').pop();
        this.dispatchEvent(new CustomEvent(EVENT_CHANGE_TITLE, { detail: { title: title } }));
      } catch (error) {
        console.warn(error);
      }
    });
  }

  connectedCallback() {
    this.#loadDatalist();
  }

  #addDatalist(url) {
    this.#datalist.querySelectorAll(`option[value="${url}"]`).forEach((option) => option.remove());
    this.#datalist.prepend(new Option(url, url));
    this.#datalist.querySelectorAll('option').forEach((option, i) => i > 30 && option.remove());
  }

  #loadDatalist() {
    this.#datalist.textContent = null;
    const urls = FlayStorage.local.getArray('urls');
    urls.filter((url) => url !== '').forEach((url) => this.#datalist.appendChild(new Option(url, url)));
  }

  #saveDatalist() {
    const urls = Array.from(this.#datalist.querySelectorAll('option')).map((option) => option.value);
    FlayStorage.local.setArray('urls', urls);
  }
}

customElements.define('browser-panel', BrowserPanel);
