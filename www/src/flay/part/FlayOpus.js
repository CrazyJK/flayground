import SVG from '../../svg/SVG';
import FlayBasket from '../FlayBasket';
import FlayHTMLElement from './FlayHTMLElement';
import './FlayOpus.scss';

/**
 * Custom element of Opus
 */
export default class FlayOpus extends FlayHTMLElement {
  flay;

  constructor() {
    super();

    this.init();
  }

  init() {
    this.wrapper.innerHTML = `
      <div>
        <label><a>Opus</a></label>
        <button type="button">${SVG.basket}</button>
      </div>
    `;

    this.wrapper.querySelector('a').addEventListener('click', () => window.open('/flay/' + this.flay.opus, this.flay.opus, 'width=800px,height=1200px'));
    this.wrapper.querySelector('button').addEventListener('click', () => FlayBasket.add(this.flay.opus));
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.dataset.opus = flay.opus;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.querySelector('a').innerHTML = flay.opus;
  }
}

// Define the new element
customElements.define('flay-opus', FlayOpus);
