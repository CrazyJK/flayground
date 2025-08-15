import FlayPartElement from '@flay/domain/part/FlayPartElement';
import { Flay } from '@lib/FlayFetch';
import { popupStudio } from '@lib/FlaySearch';
import './FlayStudio.scss';

/**
 * Custom element of Studio
 */
export default class FlayStudio extends FlayPartElement {
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

customElements.define('flay-studio', FlayStudio);
