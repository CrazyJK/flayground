import { EVENT_CHANGE_TITLE } from '@const/GroundConstant';
import FlayStorage from '@lib/FlayStorage';
import windowButton from '@svg/windowButton';

export class BrowserPanel extends HTMLElement {
  #input: HTMLInputElement;
  #datalist: HTMLDataListElement;
  #iframe: HTMLIFrameElement;
  #reload: HTMLButtonElement;

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
        .hover-bar {
          background-color: transparent;
          position: absolute;
          top: 0;
          width: 100%;
          height: 8px;
        }
        .hover-bar:hover + .url-bar {
          display: flex;
        }
        .url-bar:focus-within, .url-bar:hover {
          display: flex;
        }
        .url-bar {
          position: absolute;
          top: 8px;
          padding: 0 8px;
          width: calc(100% - 16px);
          display: none;
          outline: none;
        }
        .url-bar button {
          background-color: var(--color-bg);
          color: var(--color-text);
          border: none;
          border-radius: 4px 0 0 4px;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .url-bar button svg {
          width: 1.25rem;
        }
        .url-bar input {
          background-color: var(--color-bg);
          color: var(--color-text);
          border: 0;
          border-radius: 0 4px 4px 0;
          display: block;
          width: 100%;
          padding: 0.5em;
          outline: none;
        }
      </style>
      <iframe></iframe>
      <div class="hover-bar"></div>
      <div class="url-bar">
        <button type="button" id="reload">${windowButton.reload}</button>
        <input type="url" list="url-list" placeholder="Enter URL"/>
        <datalist id="url-list">
      </div>
    `;

    this.#reload = this.shadowRoot.querySelector('#reload');
    this.#input = this.shadowRoot.querySelector('input');
    this.#datalist = this.shadowRoot.querySelector('#url-list');
    this.#iframe = this.shadowRoot.querySelector('iframe');

    this.#input.addEventListener('keyup', (e) => {
      if (e.key !== 'Enter') return;
      this.#loadFrame();
    });
    this.#reload.addEventListener('click', () => {
      this.#loadFrame();
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

  #loadFrame() {
    const url = this.#input.value.trim();
    if (url === '') return;
    this.#iframe.src = url;
    this.#addDatalist(url);
    this.#saveDatalist();
  }

  #addDatalist(url: string) {
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
