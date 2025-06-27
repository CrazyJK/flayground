import { Flay } from '@lib/FlayFetch';
import { popupFlay } from '@lib/FlaySearch';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayTitle.scss';

/**
 * Custom element of Title
 */
export default class FlayTitle extends FlayHTMLElement {
  constructor() {
    super();

    this.innerHTML = `<label><a>Title</a></label>`;

    if (location.pathname.indexOf('popup.flay.html') < 0) {
      this.querySelector('a').addEventListener('click', () => this.#handlerPopupFlay());
    }
  }

  connectedCallback() {
    this.classList.add('flay-title');
  }

  /**
   *
   * @param flay
   */
  set(flay: Flay): void {
    this.setFlay(flay);

    this.querySelector('a').title = flay.title;
    this.querySelector('a').textContent = flay.title;
  }

  #handlerPopupFlay(): void {
    popupFlay(this.flay.opus);
    this.dispatchEvent(new Event('click', { composed: true }));
  }
}

defineCustomElements('flay-title', FlayTitle);
