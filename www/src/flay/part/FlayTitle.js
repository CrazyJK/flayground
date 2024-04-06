import FlayHTMLElement from './FlayHTMLElement';
import './FlayTitle.scss';

/**
 * Custom element of Title
 */
export default class FlayTitle extends FlayHTMLElement {
  flay;

  constructor() {
    super();
  }

  connectedCallback() {
    const label = this.wrapper.appendChild(document.createElement('label'));
    this.anker = label.appendChild(document.createElement('a'));
    this.anker.innerHTML = 'Title';
    if (location.pathname.indexOf('popup.flay.html') < 0) {
      this.anker.addEventListener('click', () => {
        window.open('popup.flay.html?opus=' + this.flay.opus, 'popup.' + this.flay.opus, 'width=800px,height=1280px');
      });
    }
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);

    this.anker.setAttribute('title', flay.title);
    this.anker.textContent = flay.title;
  }
}

// Define the new element
customElements.define('flay-title', FlayTitle);
