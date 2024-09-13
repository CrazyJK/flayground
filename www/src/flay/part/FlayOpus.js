import basketSVG from '../../svg/basket.svg';
import jsonSVG from '../../svg/json.svg';
import FlaySearch, { popupFlayInfo } from '../../util/FlaySearch';
import FlayHTMLElement from './FlayHTMLElement';
import './FlayOpus.scss';

/**
 * Custom element of Opus
 */
export default class FlayOpus extends FlayHTMLElement {
  flay;

  constructor() {
    super();

    this.classList.add('flay-opus');
    this.innerHTML = `
      <div>
        <button type="button" id="jsonViewBtn" title="flay json viewer">${jsonSVG}</button>
        <label><a>Opus</a></label>
        <button type="button" id="keepBasketBtn" title="keep flay in basket">${basketSVG}</button>
      </div>
    `;

    this.querySelector('a').addEventListener('click', () => FlaySearch.opus.Arzon(this.flay.opus));
    this.querySelector('#jsonViewBtn').addEventListener('click', () => popupFlayInfo(this.flay.opus));
    this.querySelector('#keepBasketBtn').addEventListener('click', async () => {
      const { FlayBasket } = await import(/* webpackChunkName: "FlayBasket" */ '../FlayBasket');
      FlayBasket.add(this.flay.opus);
    });
  }

  connectedCallback() {}

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.dataset.opus = flay.opus;
    this.classList.toggle('archive', this.flay.archive);
    this.querySelector('a').innerHTML = flay.opus;
  }
}

// Define the new element
customElements.define('flay-opus', FlayOpus, { extends: 'div' });
