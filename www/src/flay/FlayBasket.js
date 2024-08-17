import GridControl from '../lib/GridControl';
import SVG from '../svg/SVG';
import { popupFlay } from '../util/FlaySearch';
import FlayStorage from '../util/FlayStorage';
import { getRandomInt } from '../util/randomNumber';
import StringUtils from '../util/StringUtils';
import './FlayBasket.scss';

const BASKET_KEY = 'flay-basket';

export default class FlayBasket extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-basket');
    this.innerHTML = `
      <div class="body">
        <div id="actressList" class="hide"></div>
        <div id="basketList"></div>
      </div>
      <div class="footer">
        <div class="control">
          <button type="button" id="pickUpRandomFlay" title="pick up random flay"><span id="flayCount">0</span> Flay</button>
          <button type="button" id="toggleActressName" title="toggle actress name"><span id="actressCount">0</span> ${SVG.vagina}</button>
          <button type="button" id="emptyAll" title="empty All">${SVG.trashBin}</button>
        </div>
      </div>
    `;

    this.querySelector('.control').prepend(new GridControl('#basketList'));

    this.actressListEl = this.querySelector('#actressList');
    this.listEl = this.querySelector('#basketList');

    this.flayCountEl = this.querySelector('#flayCount');
    this.actressCountEl = this.querySelector('#actressCount');

    this.pickUpRandomFlayEl = this.querySelector('#pickUpRandomFlay');
    this.toggleActressNameEl = this.querySelector('#toggleActressName');
    this.emptyAllEl = this.querySelector('#emptyAll');
  }

  connectedCallback() {
    onstorage = async (e) => {
      if (e.key !== BASKET_KEY) return;
      await this.render();
    };

    this.actressListEl.addEventListener('change', () => {
      const itemList = this.querySelectorAll(`[data-opus]`);
      const checkedList = this.actressListEl.querySelectorAll('input:checked');

      itemList.forEach((item) => item.classList.toggle('hide', checkedList.length > 0));
      checkedList.forEach((checkbox) => {
        itemList.forEach((item) => {
          if (item.hasActress(checkbox.value)) item.classList.remove('hide');
        });
      });

      this.flayCountEl.innerHTML = this.querySelectorAll(`[data-opus]:not(.hide)`).length;
    });

    this.pickUpRandomFlayEl.addEventListener('click', () => {
      const shownFlayList = Array.from(this.listEl.children).filter((item) => !item.classList.contains('hide'));
      shownFlayList[getRandomInt(0, shownFlayList.length)]?.popup();
    });

    this.toggleActressNameEl.addEventListener('click', () => this.actressListEl.classList.toggle('hide'));

    this.emptyAllEl.addEventListener('click', async () => {
      if (confirm('A U Sure?')) {
        FlayBasket.clear();
        await this.render();
      }
    });

    this.render();
  }

  async render() {
    const basket = getBasket();

    if (basket.size === 0) this.listEl.textContent = null;
    Array.from(this.listEl.children).forEach((item) => {
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

    this.actressListEl.textContent = null;
    Array.from(this.listEl.children)
      .reduce((map, item) => {
        item.flay.actressList.forEach((name) => {
          if (!map.has(name)) map.set(name, { size: 0 });
          map.get(name).size += 1;
        });
        return map;
      }, new Map())
      .forEach((obj, name) => {
        const key = name.replace(/ /g, '');
        this.actressListEl.innerHTML += `
          <input type="checkbox" id="${key}" value="${name}">
          <label class="border" for="${key}">${name} <small style="font-size: calc(var(--size-small) + ${obj.size}px)">${obj.size}</small></label>
        `;
      });

    this.flayCountEl.innerHTML = this.listEl.children.length;
    this.actressCountEl.innerHTML = this.actressListEl.querySelectorAll('input').length;
  }

  static add(opus) {
    const basket = getBasket();
    basket.delete(opus);
    basket.add(opus);
    setBasket(basket);
    window.emitNotice(`add Basket: ${opus} ${basket.size} flay`);
  }

  static remove(opus) {
    const basket = getBasket();
    basket.delete(opus);
    setBasket(basket);
    window.emitNotice(`remove Basket: ${opus} ${basket.size} flay`);
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
      <div class="cover">
        <label class="comment"></label>
      </div>
      <div class="title">
        <button type="button" class="popup-flay">title</button>
      </div>
      <div class="info">
        <div class="actress"></div>
        <div class="tags"></div>
      </div>
      <button type="button" class="empty-this">${SVG.trashBin}</button>
    `;

    this.querySelector('.popup-flay').addEventListener('click', async () => await this.popup());
    this.querySelector('.empty-this').addEventListener('click', async () => await this.delete());
  }

  async set(opus) {
    this.dataset.opus = opus;

    const res = await fetch(`/static/cover/${opus}/withData`);
    this.flay = JSON.parse(decodeURIComponent(res.headers.get('Data').replace(/\+/g, ' ')));

    this.querySelector('.cover').style.backgroundImage = `url(${URL.createObjectURL(await res.blob())})`;
    this.querySelector('.comment').innerHTML = this.flay.video.comment;
    this.querySelector('.popup-flay').innerHTML = this.flay.title;
    this.querySelector('.actress').innerHTML = this.flay.actressList?.map((name) => `<label>${name}</label>`).join(', ');
    this.querySelector('.tags').innerHTML = this.flay.video.tags?.map((tag) => `<label>${tag.name}</label>`).join(' ');
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

  async popup() {
    await this.delete();
    popupFlay(this.flay.opus);
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
