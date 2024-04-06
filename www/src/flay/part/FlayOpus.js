import FlayHTMLElement from './FlayHTMLElement';
import './FlayOpus.scss';

/**
 * Custom element of Opus
 */
export default class FlayOpus extends FlayHTMLElement {
  flay;

  constructor() {
    super();
  }

  connectedCallback() {
    const label = this.wrapper.appendChild(document.createElement('label'));
    this.opus = label.appendChild(document.createElement('a'));
    this.opus.innerHTML = 'Opus';
    this.opus.addEventListener('click', () => {
      console.log('opusClick', this.flay.opus);
      window.open('/flay/' + this.flay.opus, this.flay.opus, 'width=800px,height=1200px');
    });
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);

    this.opus.textContent = flay.opus;
  }
}

// Define the new element
customElements.define('flay-opus', FlayOpus);
