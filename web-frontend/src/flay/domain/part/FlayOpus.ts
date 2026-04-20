import FlayPartElement from '@flay/domain/part/FlayPartElement';
import { Flay } from '@lib/FlayFetch';
import FlaySearch, { popupFlayInfo } from '@lib/FlaySearch';
import basketSVG from '@svg/basket';
import jsonSVG from '@svg/json';
import './FlayOpus.scss';

/**
 * Custom element of Opus
 */
export default class FlayOpus extends FlayPartElement {
  constructor() {
    super();

    this.innerHTML = `
      <div>
        <button type="button" id="jsonViewBtn" title="flay json viewer">${jsonSVG}</button>
        <label><a>Opus</a></label>
        <button type="button" id="keepBasketBtn" title="keep flay in basket">${basketSVG}</button>
      </div>
    `;

    this.querySelector('a')!.addEventListener('click', () => FlaySearch.Avdbs(this.flay.opus));
    this.querySelector('#jsonViewBtn')!.addEventListener('click', () => popupFlayInfo(this.flay.opus));
    this.querySelector('#keepBasketBtn')!.addEventListener('click', async () => {
      const { FlayBasket } = await import(/* webpackChunkName: "FlayBasket" */ '@flay/panel/FlayBasket');
      FlayBasket.add(this.flay.opus);
    });
  }

  connectedCallback() {}

  /**
   *
   * @param flay
   */
  set(flay: Flay): void {
    this.setFlay(flay);

    this.querySelector('a')!.innerHTML = flay.opus;
  }
}

customElements.define('flay-opus', FlayOpus);
