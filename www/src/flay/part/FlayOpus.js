import SVG from '../../svg/SVG';
import FlaySearch from '../../util/FlaySearch';
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
        <button type="button" id="jsonViewBtn">${SVG.json}</button>
        <label><a>Opus</a></label>
        <button type="button" id="keepBasketBtn">${SVG.basket}</button>
      </div>
    `;

    this.wrapper.querySelector('a').addEventListener('click', () => FlaySearch.opus.Arzon(this.flay.opus));
    this.wrapper.querySelector('#jsonViewBtn').addEventListener('click', () => window.open('/flay/' + this.flay.opus, this.flay.opus, 'width=800px,height=1200px'));
    this.wrapper.querySelector('#keepBasketBtn').addEventListener('click', () => FlayBasket.add(this.flay.opus));
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
