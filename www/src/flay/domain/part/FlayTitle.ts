import FlayPartElement from '@flay/domain/part/FlayPartElement';
import { Flay } from '@lib/FlayFetch';
import { popupFlay } from '@lib/FlaySearch';
import './FlayTitle.scss';

/**
 * Custom element of Title
 */
export default class FlayTitle extends FlayPartElement {
  constructor() {
    super();

    this.innerHTML = `<label><a>Title</a></label>`;

    if (!location.pathname.includes('popup.flay.html')) {
      this.querySelector('a')!.addEventListener('click', () => this.#handlerPopupFlay());
    }
  }

  connectedCallback() {}

  /**
   *
   * @param flay
   */
  set(flay: Flay): void {
    this.setFlay(flay);

    this.querySelector('a')!.title = flay.title;
    this.querySelector('a')!.textContent = flay.title;
  }

  #handlerPopupFlay(): void {
    popupFlay(this.flay.opus);
    this.dispatchEvent(new Event('click', { composed: true }));
  }
}

customElements.define('flay-title', FlayTitle);
