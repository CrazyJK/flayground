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
      this.querySelector('a').addEventListener('click', () => {
        popupFlay(this.flay.opus);
        this.dispatchEvent(new Event('click', { composed: true }));
      });
    }
  }

  connectedCallback() {
    this.classList.add('flay-title');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.setFlay(flay);

    this.querySelector('a').title = flay.title;
    this.querySelector('a').textContent = flay.title;
  }
}

defineCustomElements('flay-title', FlayTitle);
