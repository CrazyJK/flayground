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
      <div class="body">
        <div id="actressList"></div>
        <div id="basketList"></div>
      </div>
      <div class="footer">
        <div class="control">
          <input type="range" id="columnLength" min="1" max="5" step="1" value="5">
          <label><span id="flayCount">0</span><span>F</span></label>
          <button type="button" id="emptyAll" title="empty All">${SVG.trashBin}</button>
        </div>
      </div>
    `;

    this.listEl = this.querySelector('#basketList');
    this.columnLengthEl = this.querySelector('#columnLength');
    this.flayCountEl = this.querySelector('#flayCount');
    this.emptyAllEl = this.querySelector('#emptyAll');
  }

  connectedCallback() {
    onstorage = async (e) => {
      if (e.key !== BASKET_KEY) return;
      await this.render();
    };

    this.emptyAllEl.addEventListener('click', async () => {
      if (confirm('A U Sure?')) {
        FlayBasket.clear();
        await this.render();
      }
    });

    this.columnLengthEl.addEventListener('change', () => {
      this.listEl.dataset.column = this.columnLengthEl.value;
      FlayStorage.local.set(BASKET_COLUMN, this.columnLengthEl.value);
    });
    this.columnLengthEl.value = FlayStorage.local.getNumber(BASKET_COLUMN, 0);
    this.columnLengthEl.dispatchEvent(new Event('change'));

    this.render();
  }

  async render() {
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
        item = new FlayBasketItem();
        await item.set(opus);
        item.addEventListener('delete', () => this.render());
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

    const actressListEl = this.querySelector('#actressList');
    actressListEl.textContent = null;
    Array.from(this.querySelectorAll(`[data-opus]`))
      .reduce((map, item) => {
        item.flay.actressList.forEach((name) => {
          if (!map.has(name)) map.set(name, { size: 0 });
          map.get(name).size += 1;
        });
        return map;
      }, new Map())
      .forEach((obj, name) => {
        const key = name.replace(/ /g, '');
        actressListEl.innerHTML += `
          <input type="checkbox" id="${key}" value="${name}">
          <label class="border" for="${key}">${name} <small>(${obj.size})</small></label>
        `;
      });

    actressListEl.addEventListener('change', () => {
      const itemList = this.querySelectorAll(`[data-opus]`);
      const checkedList = actressListEl.querySelectorAll('input:checked');

      itemList.forEach((item) => item.classList.toggle('hide', checkedList.length > 0));
      checkedList.forEach((checkbox) => {
        itemList.forEach((item) => {
          if (item.hasActress(checkbox.value)) item.classList.remove('hide');
        });
      });

      this.flayCountEl.innerHTML = this.querySelectorAll(`[data-opus]:not(.hide)`).length;
    });
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

class FlayBasketItem extends HTMLDivElement {
  flay;

  constructor() {
    super();

    this.classList.add('flay-basket-item');
    this.innerHTML = `
      <button type="button" class="popup-flay">title</button>
      <div class="flay-basket-item-cover">
        <div class="tags"></div>
        <button type="button" class="empty-this">${SVG.trashBin}</button>
      </div>
    `;

    this.querySelector('.popup-flay').addEventListener('click', async () => {
      await this.delete();
      window.open('popup.flay.html?opus=' + this.flay.opus, 'popup.' + this.flay.opus, 'width=800px,height=1280px');
    });
    this.querySelector('.empty-this').addEventListener('click', async () => {
      await this.delete();
    });
  }

  async set(opus) {
    this.dataset.opus = opus;

    const res = await fetch(`/static/cover/${opus}/withData`);
    this.flay = JSON.parse(decodeURIComponent(res.headers.get('Data').replace(/\+/g, ' ')));
    this.querySelector('.flay-basket-item-cover').style.backgroundImage = `url(${URL.createObjectURL(await res.blob())})`;
    this.querySelector('.popup-flay').innerHTML = this.flay.title;
    this.flay.video.tags?.forEach((tag) => {
      this.querySelector('.tags').innerHTML += `<label>${tag.name}</label>`;
    });
  }

  hasActress(name) {
    return this.flay.actressList.includes(name);
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
    this.dispatchEvent(new CustomEvent('delete'));
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
