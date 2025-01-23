import { EVENT_BASKET_ADD } from '../../GroundConstant';
import FlayFetch from '../../lib/FlayFetch';
import { popupActress, popupFlay, popupTag } from '../../lib/FlaySearch';
import FlayStorage from '../../lib/FlayStorage';
import { getRandomInt } from '../../lib/randomNumber';
import StringUtils from '../../lib/StringUtils';
import trashBinSVG from '../../svg/trashBin';
import vaginaSVG from '../../svg/vagina';
import GridControl from '../../ui/GridControl';
import './FlayBasket.scss';

const BASKET_KEY = 'flay-basket';

export class FlayBasket extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-basket', 'flay-div');
    this.innerHTML = `
      <div class="body">
        <div id="actressList" class="hide"></div>
        <div id="basketList"></div>
      </div>
      <div class="footer">
        <div class="control">
          <button type="button" id="pickUpRandomFlay" title="pick up random flay"><span id="flayCount">0</span> Flay</button>
          <button type="button" id="toggleActressName" title="toggle actress name"><span id="actressCount">0</span> ${vaginaSVG}</button>
          <button type="button" id="emptyAll" title="empty All">${trashBinSVG}</button>
        </div>
      </div>
    `;

    this.querySelector('.control').prepend(new GridControl('#basketList'));

    this.flayListEl = this.querySelector('#basketList');
    this.flayCountEl = this.querySelector('#flayCount');

    this.actressListEl = this.querySelector('#actressList');
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

    document.addEventListener(EVENT_BASKET_ADD, async () => await this.render());

    this.actressListEl.addEventListener('change', () => {
      const itemList = Array.from(this.flayListEl.children);
      const checkedList = Array.from(this.actressListEl.children)
        .map((span) => span.querySelector('input'))
        .filter((input) => input.checked);

      itemList.forEach((item) => item.classList.toggle('hide', checkedList.length > 0));
      checkedList.forEach((checkbox) => {
        itemList.forEach((item) => {
          if (item.hasActress(checkbox.value)) item.classList.remove('hide');
        });
      });

      this.flayCountEl.innerHTML = itemList.filter((item) => !item.classList.contains('hide')).length;
    });

    this.pickUpRandomFlayEl.addEventListener('click', () => {
      const shownFlayList = Array.from(this.flayListEl.children).filter((item) => !item.classList.contains('hide'));
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

    if (basket.size === 0) this.flayListEl.textContent = null;
    Array.from(this.flayListEl.children).forEach((item) => {
      if (!basket.has(item.opus)) item.remove();
    });

    const existsList = await FlayFetch.existsFlayList(...basket);
    for (const opus of basket) if (!existsList[opus]) FlayBasket.remove(opus);

    const flayList = await FlayFetch.getFlayList(...basket);
    for (const flay of flayList) {
      let item = this.querySelector(`#${flay.opus}`);
      const isNew = item === null;
      if (isNew) {
        item = new FlayBasketItem(flay);
        item.addEventListener('delete', () => this.render());
      }

      this.flayListEl.prepend(item);
      item.scrollIntoView(false);

      if (isNew) {
        item.animate(
          [
            { transform: 'scale(0.9)', opacity: 0.5 },
            { transform: 'scale(1.1)', opacity: 0.3 },
            { transform: 'scale(1)', opacity: 1 },
          ],
          { duration: 600, iterations: 1, easing: 'ease' }
        );
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      this.flayCountEl.innerHTML = this.flayListEl.children.length;
    }

    this.actressListEl.textContent = null;
    Array.from(this.flayListEl.children)
      .reduce((map, item) => {
        item.actressList.forEach((name) => {
          if (!map.has(name)) map.set(name, { size: 0 });
          map.get(name).size += 1;
        });
        return map;
      }, new Map())
      .forEach((obj, name) => {
        const key = name.replace(/ /g, '');
        this.actressListEl.appendChild(document.createElement('span')).innerHTML = `
          <input type="checkbox" id="${key}" value="${name}">
          <label class="border" for="${key}">${name} <small style="font-size: calc(var(--size-small) + ${obj.size}px)">${obj.size}</small></label>
        `;
        this.actressCountEl.innerHTML = this.actressListEl.children.length;
      });
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
customElements.define('flay-basket', FlayBasket, { extends: 'div' });

class FlayBasketItem extends HTMLDivElement {
  constructor(flay) {
    super();

    this.id = flay.opus;
    this.opus = flay.opus;
    this.classList.add('flay-basket-item', 'flay-div');
    this.innerHTML = `
      <div class="cover">
        <label class="comment"></label>
      </div>
      <div class="title">
        <a class="popup-flay">title</a>
      </div>
      <div class="info">
        <div class="actress"></div>
        <div class="tags"></div>
      </div>
      <button type="button" class="empty-this" title="remove flay in basket">${trashBinSVG}</button>
    `;

    this.querySelector('.empty-this').addEventListener('click', async () => await this.#delete(flay.opus));

    this.querySelector('.comment').innerHTML = flay.video.comment;
    this.querySelector('.popup-flay').innerHTML = flay.title;
    this.querySelector('.popup-flay').addEventListener('click', async () => this.popup());
    this.querySelector('.actress').append(
      ...Array.from(flay.actressList || []).map((name) => {
        const a = document.createElement('a');
        a.innerHTML = name;
        a.addEventListener('click', () => popupActress(name));
        return a;
      })
    );
    this.querySelector('.tags').append(
      ...Array.from(flay.video.tags || [])
        .filter((tag) => ![50, 63, 64, 65, 66].includes(tag.id))
        .map((tag) => {
          const a = document.createElement('a');
          a.innerHTML = tag.name;
          a.addEventListener('click', () => popupTag(tag.id));
          return a;
        })
    );

    FlayFetch.getCover(flay.opus).then((url) => {
      this.querySelector('.cover').style.backgroundImage = `url(${url})`;
    });
  }

  async #delete(opus) {
    await this.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.1)', opacity: 0.8 },
        { transform: 'scale(0)', opacity: 0 },
      ],
      { duration: 800, iterations: 1, easing: 'cubic-bezier(0.42, 0, 0.58, 1)' }
    ).finished;
    FlayBasket.remove(opus);
    this.dispatchEvent(new CustomEvent('delete'));
  }

  async popup() {
    await this.#delete(this.id);
    popupFlay(this.id);
  }

  hasActress(name) {
    return this.actressList.includes(name);
  }

  get actressList() {
    return Array.from(this.querySelectorAll('.actress a')).map((a) => a.innerHTML);
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
