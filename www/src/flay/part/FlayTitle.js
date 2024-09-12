import { popupFlay } from '../../util/FlaySearch';
import FlayHTMLElement from './FlayHTMLElement';
import './FlayTitle.scss';

/**
 * Custom element of Title
 */
export default class FlayTitle extends FlayHTMLElement {
  flay;

  constructor() {
    super();

    this.init();
  }

  init() {
    const label = this.appendChild(document.createElement('label'));
    this.anker = label.appendChild(document.createElement('a'));
    this.anker.innerHTML = 'Title';
    if (location.pathname.indexOf('popup.flay.html') < 0) {
      this.anker.addEventListener('click', () => {
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
    this.flay = flay;
    this.classList.toggle('archive', this.flay.archive);
    this.setAttribute('data-opus', flay.opus);

    this.anker.setAttribute('title', flay.title);
    this.anker.textContent = flay.title;
  }
}

// Define the new element
customElements.define('flay-title', FlayTitle, { extends: 'div' });
