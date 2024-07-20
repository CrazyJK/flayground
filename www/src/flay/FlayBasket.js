import SVG from '../svg/SVG';
import FlayStorage from '../util/FlayStorage';
import StringUtils from '../util/StringUtils';
import './FlayBasket.scss';

export default class FlayBasket extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add(this.constructor.name);
  }

  connectedCallback() {
    window.addEventListener('storage', (e) => {
      if (e.key !== 'flay-basket') return;
      this.render();
    });

    this.render();
  }

  render() {
    const basket = getBasket();
    let prevItem = null;
    basket.forEach((opus) => {
      let item = this.querySelector(`.${opus}`);
      if (item === null) item = new FlayBasketItem(opus);
      this.insertBefore(item, prevItem);
      prevItem = item;
    });
  }

  static add(opus) {
    const basket = getBasket();
    basket.delete(opus);
    basket.add(opus);
    setBasket(basket);
  }

  static remove(opus) {
    const basket = getBasket();
    basket.delete(opus);
    setBasket(basket);
  }

  static clear() {
    const basket = getBasket();
    basket.clear();
    setBasket(basket);
  }
}

class FlayBasketItem extends HTMLDivElement {
  constructor(opus) {
    super();
    this.classList.add(this.constructor.name, opus);
    this.style.backgroundImage = `url(/static/cover/${opus})`;
    this.innerHTML = `
      <button type="button" class="popup-flay">${opus}</button>
      <button type="button" class="empty-this">${SVG.trashBin}</button>
    `;
    this.querySelector('.popup-flay').addEventListener('click', () => window.open('popup.flay.html?opus=' + opus, 'popup.' + opus, 'width=800px,height=1280px'));
    this.querySelector('.empty-this').addEventListener('click', () => {
      this.remove();
      FlayBasket.remove(opus);
    });
  }
}

customElements.define('flay-basket', FlayBasket, { extends: 'div' });
customElements.define('flay-basket-item', FlayBasketItem, { extends: 'div' });

/**
 *
 * @returns {Set<string>} basket
 */
function getBasket() {
  const value = FlayStorage.local.get('flay-basket', '');
  return new Set(StringUtils.isBlank(value) ? [] : value.split(','));
}

/**
 *
 * @param {Set<string>} basket
 */
function setBasket(basket) {
  FlayStorage.local.set('flay-basket', Array.from(basket).join(','));
}
