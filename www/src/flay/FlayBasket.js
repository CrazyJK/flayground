import SVG from '../svg/SVG';
import FlayStorage from '../util/FlayStorage';
import StringUtils from '../util/StringUtils';
import './FlayBasket.scss';

const BASKET_KEY = 'flay-basket';
const BASKET_COLUMN = 'flay-basket.column.length';

export default class FlayBasket extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-basket');
    this.innerHTML = `
      <div class="list"></div>
      <div class="control">
        <input type="range" id="columnLength" min="1" max="5" step="1" value="5">
        <label><span id="flayCount">0</span><span>F</span></label>
        <button type="button" id="emptyAll" title="empty All">${SVG.trashBin}</button>
      </div>
    `;

    this.flayCountEl = this.querySelector('#flayCount');
    this.listEl = this.querySelector('.list');
    this.emptyAllEl = this.querySelector('#emptyAll');
    this.columnLengthEl = this.querySelector('#columnLength');
  }

  connectedCallback() {
    onstorage = async (e) => {
      if (e.key !== BASKET_KEY) return;
      this.render();
    };

    this.emptyAllEl.addEventListener('click', () => {
      FlayBasket.clear();
      this.render();
    });

    this.columnLengthEl.addEventListener('change', () => {
      this.listEl.dataset.column = this.columnLengthEl.value;
      FlayStorage.local.set(BASKET_COLUMN, this.columnLengthEl.value);
    });
    this.columnLengthEl.value = FlayStorage.local.getNumber(BASKET_COLUMN, 0);
    this.columnLengthEl.dispatchEvent(new Event('change'));

    this.render();
  }

  render() {
    const basket = getBasket();
    this.flayCountEl.innerHTML = basket.size;
    if (basket.size === 0) this.listEl.textContent = null;

    this.querySelectorAll('.flay-basket-item').forEach((item) => {
      if (!basket.has(item.dataset.opus)) item.remove();
    });

    for (const opus of basket) {
      let isNew = false;
      let item = this.querySelector(`[data-opus="${opus}"]`);
      if (item === null) {
        item = new FlayBasketItem(opus);
        isNew = true;
      }

      this.listEl.prepend(item);
      item.scrollIntoView(false);

      if (isNew)
        item.animate(
          [
            { transform: 'scale(0.9)', opacity: 0.5 },
            { transform: 'scale(1.1)', opacity: 0.3 },
            { transform: 'scale(1)', opacity: 1 },
          ],
          { duration: 600, iterations: 1, easing: 'ease' }
        );
    }
  }

  static add(opus) {
    const basket = getBasket();
    basket.delete(opus);
    basket.add(opus);
    setBasket(basket);
    window.emitNotice('add Basket: ' + opus);
  }

  static remove(opus) {
    const basket = getBasket();
    basket.delete(opus);
    setBasket(basket);
    window.emitNotice('remove Basket: ' + opus);
  }

  static clear() {
    const basket = getBasket();
    basket.clear();
    setBasket(basket);
    window.emitNotice('clear Basket');
  }
}

customElements.define('flay-basket', FlayBasket, { extends: 'div' });

class FlayBasketItem extends HTMLDivElement {
  constructor(opus) {
    super();

    this.dataset.opus = opus;
    this.classList.add('flay-basket-item');
    this.innerHTML = `
      <button type="button" class="popup-flay">title</button>
      <button type="button" class="empty-this">${SVG.trashBin}</button>
    `;

    this.querySelector('.popup-flay').addEventListener('click', async () => {
      await this.delete();
      window.open('popup.flay.html?opus=' + opus, 'popup.' + opus, 'width=800px,height=1280px');
    });
    this.querySelector('.empty-this').addEventListener('click', async () => {
      await this.delete();
    });

    fetch(`/static/cover/${opus}/withData`).then((res) => {
      const flay = JSON.parse(decodeURIComponent(res.headers.get('Data').replace(/\+/g, ' ')));
      res.blob().then((blob) => {
        this.style.backgroundImage = `url(${URL.createObjectURL(blob)})`;
        this.querySelector('.popup-flay').innerHTML = flay.title;
      });
    });
  }

  async delete() {
    await this.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.1)', opacity: 0.8 },
        { transform: 'scale(0)', opacity: 0 },
      ],
      { duration: 800, iterations: 1, easing: 'cubic-bezier(0.42, 0, 0.58, 1)' }
    ).finished;
    FlayBasket.remove(this.dataset.opus);
    this.remove();
  }
}

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
