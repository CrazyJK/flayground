import SVG from '../svg/SVG';
import FlayStorage from '../util/FlayStorage';
import StringUtils from '../util/StringUtils';
import './FlayBasket.scss';

const BASKET_KEY = 'flay-basket';

export default class FlayBasket extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-basket');
    this.innerHTML = `
      <div class="list"></div>
      <div class="control">
        <button type="button" id="emptyAll">${SVG.trashBin}</button>
      </div>
    `;
  }

  connectedCallback() {
    onstorage = (e) => {
      if (e.key !== BASKET_KEY) return;
      this.render();
    };
    this.render();

    this.querySelector('#emptyAll').addEventListener('click', () => {
      FlayBasket.clear();
      this.render();
    });
  }

  render() {
    const basket = getBasket();
    if (basket.size === 0) this.querySelector('.list').textContent = null;

    this.querySelectorAll('.flay-basket-item').forEach((item) => {
      if (!basket.has(item.dataset.opus)) item.remove();
    });

    let prevItem = null;
    basket.forEach((opus) => {
      let item = this.querySelector(`[data-opus="${opus}"]`);
      if (item === null) item = new FlayBasketItem(opus);
      this.querySelector('.list').insertBefore(item, prevItem);
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

    this.dataset.opus = opus;
    this.classList.add('flay-basket-item');
    // this.style.backgroundImage = `url(/static/cover/${opus})`;
    this.innerHTML = `
      <button type="button" class="popup-flay">title</button>
      <button type="button" class="empty-this">${SVG.trashBin}</button>
    `;
    this.querySelector('.popup-flay').addEventListener('click', () => {
      window.open('popup.flay.html?opus=' + opus, 'popup.' + opus, 'width=800px,height=1280px');
      this.remove();
      FlayBasket.remove(opus);
    });
    this.querySelector('.empty-this').addEventListener('click', () => {
      this.remove();
      FlayBasket.remove(opus);
    });

    fetch(`/static/cover/${opus}/withData`).then((res) => {
      const flay = JSON.parse(decodeURIComponent(res.headers.get('Data').replace(/\+/g, ' ')));
      res.blob().then((blob) => {
        this.style.backgroundImage = `url(${URL.createObjectURL(blob)})`;
        this.querySelector('.popup-flay').innerHTML = flay.title;
      });
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
  const value = FlayStorage.local.get(BASKET_KEY, '');
  return new Set(StringUtils.isBlank(value) ? [] : value.split(','));
}

/**
 *
 * @param {Set<string>} basket
 */
function setBasket(basket) {
  FlayStorage.local.set(BASKET_KEY, Array.from(basket).join(','));
}
