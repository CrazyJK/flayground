import FlaySearch, { popupFlayInfo } from '../../../lib/FlaySearch';
import basketSVG from '../../../svg/basket';
import jsonSVG from '../../../svg/json';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayOpus.scss';

/**
 * Custom element of Opus
 */
export default class FlayOpus extends FlayHTMLElement {
  constructor() {
    super();

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
      const { FlayBasket } = await import(/* webpackChunkName: "FlayBasket" */ '../../panel/FlayBasket');
      FlayBasket.add(this.flay.opus);
    });
  }

  connectedCallback() {
    this.classList.add('flay-opus');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.setFlay(flay);

    this.querySelector('a').innerHTML = flay.opus;
  }
}

defineCustomElements('flay-opus', FlayOpus);
