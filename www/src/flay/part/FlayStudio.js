import { popupStudio } from '../../util/FlaySearch';
import FlayHTMLElement from './FlayHTMLElement';
import './FlayStudio.scss';

/**
 * Custom element of Studio
 */
export default class FlayStudio extends FlayHTMLElement {
  flay;

  constructor() {
    super();

    this.init();
  }

  init() {
    const label = this.wrapper.appendChild(document.createElement('label'));
    this.studio = label.appendChild(document.createElement('a'));
    this.studio.innerHTML = 'Studio';
    this.studio.addEventListener('click', () => popupStudio(this.flay.studio));
  }

  connectedCallback() {
    this.classList.add('flay-studio');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);

    this.studio.textContent = flay.studio;
  }
}

// Define the new element
customElements.define('flay-studio', FlayStudio, { extends: 'div' });
