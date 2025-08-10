import { Flay } from '@lib/FlayFetch';
import { popupStudio } from '@lib/FlaySearch';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayStudio.scss';

/**
 * Custom element of Studio
 */
export default class FlayStudio extends FlayHTMLElement {
  constructor() {
    super();

    this.innerHTML = `<label><a>Studio</a></label>`;

    this.querySelector('a')!.addEventListener('click', () => popupStudio(this.flay.studio));
  }

  connectedCallback() {}

  /**
   *
   * @param {Flay} flay
   */
  set(flay: Flay): void {
    this.setFlay(flay);

    this.querySelector('a')!.textContent = flay.studio;
  }
}

defineCustomElements('flay-studio', FlayStudio);
