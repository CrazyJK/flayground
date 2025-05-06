import { EVENT_BASKET_ADD } from '@/GroundConstant';
import FlayFetch from '@lib/FlayFetch';
import { popupActress, popupFlay, popupTag } from '@lib/FlaySearch';
import FlayStorage from '@lib/FlayStorage';
import { getRandomInt } from '@lib/randomNumber';
import trashBinSVG from '@svg/trashBin';
import vaginaSVG from '@svg/vagina';
import GridControl from '@ui/GridControl';
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
    // localStorage 변경 감지
    window.addEventListener('storage', async (e) => {
      if (e.key !== BASKET_KEY) return;
      await this.render();
    });

    // 바스켓 아이템 추가 이벤트 리스너
    document.addEventListener(EVENT_BASKET_ADD, () => this.render());

    // 배우 필터링 이벤트
    this.actressListEl.addEventListener('change', this.#handleActressFilter.bind(this));

    // 랜덤 플레이 이벤트
    this.pickUpRandomFlayEl.addEventListener('click', this.#pickRandomFlay.bind(this));

    // 배우 목록 토글 이벤트
    this.toggleActressNameEl.addEventListener('click', () => this.actressListEl.classList.toggle('hide'));

    // 모두 비우기 이벤트
    this.emptyAllEl.addEventListener('click', async () => {
      if (confirm('A U Sure?')) {
        FlayBasket.clear();
        await this.render();
      }
    });

    // 초기 렌더링
    this.render();
  }

  #handleActressFilter() {
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
  }

  #pickRandomFlay() {
    const shownFlayList = Array.from(this.flayListEl.children).filter((item) => !item.classList.contains('hide'));
    const randomIndex = getRandomInt(0, shownFlayList.length);
    shownFlayList[randomIndex]?.popup();
  }

  async render() {
    try {
      const basket = getBasket();

      // 바스켓이 비어있으면 리스트 비우기
      if (basket.size === 0) {
        this.flayListEl.textContent = null;
        this.updateCounters();
        return;
      }

      // 존재하지 않는 아이템 제거
      this.#removeNonExistingItems(basket);

      // 존재 확인 및 존재하지 않는 Opus 제거
      const existsList = await FlayFetch.existsFlayList(...basket);
      for (const opus of basket) {
        if (!existsList[opus]) FlayBasket.remove(opus);
      }

      // Flay 리스트 가져오기 및 렌더링
      const flayList = await FlayFetch.getFlayList(...basket);
      await this.#renderFlayItems(flayList);

      // 배우 리스트 렌더링
      this.#renderActressList();

      // 카운터 업데이트
      this.updateCounters();
    } catch (error) {
      console.error('Error rendering FlayBasket:', error);
    }
  }

  #removeNonExistingItems(basket) {
    Array.from(this.flayListEl.children).forEach((item) => {
      if (!basket.has(item.opus)) item.remove();
    });
  }

  async #renderFlayItems(flayList) {
    const fragment = document.createDocumentFragment();
    const existingItems = new Set(Array.from(this.flayListEl.children).map((item) => item.id));

    for (const flay of flayList) {
      // 이미 존재하는 아이템은 건너뛰기
      if (existingItems.has(flay.opus)) continue;

      const item = new FlayBasketItem(flay);
      item.addEventListener('delete', () => this.render());

      fragment.prepend(item);
    }

    if (fragment.children.length > 0) {
      this.flayListEl.prepend(fragment);

      // 새 아이템 애니메이션 적용
      const newItems = Array.from(this.flayListEl.children).filter((item) => !existingItems.has(item.id));
      this.#animateNewItems(newItems);
    }
  }

  async #animateNewItems(items) {
    const animation = [
      { transform: 'scale(0.9)', opacity: 0.5 },
      { transform: 'scale(1.1)', opacity: 0.3 },
      { transform: 'scale(1)', opacity: 1 },
    ];
    const timing = { duration: 600, iterations: 1, easing: 'ease' };

    for (const item of items) {
      item.scrollIntoView(false);
      item.animate(animation, timing);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }

  #renderActressList() {
    this.actressListEl.textContent = null;

    // 배우 출연 횟수 계산
    const actressMap = Array.from(this.flayListEl.children).reduce((map, item) => {
      item.actressList.forEach((name) => {
        if (!map.has(name)) map.set(name, { size: 0 });
        map.get(name).size += 1;
      });
      return map;
    }, new Map());

    // 배우 목록 렌더링
    actressMap.forEach((obj, name) => {
      const key = name.replace(/ /g, '');
      const span = document.createElement('span');
      span.innerHTML = `
        <input type="checkbox" id="${key}" value="${name}">
        <label class="border" for="${key}">${name} <small style="font-size: calc(var(--size-small) + ${obj.size}px)">${obj.size}</small></label>
      `;
      this.actressListEl.appendChild(span);
    });
  }

  updateCounters() {
    this.flayCountEl.innerHTML = this.flayListEl.children.length;
    this.actressCountEl.innerHTML = this.actressListEl.children.length;
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

    // 요소 초기화 및 이벤트 설정
    this.#initializeElements(flay);

    // 커버 이미지 로드
    this.#loadCoverImage(flay.opus);
  }

  /**
   * 요소 초기화 및 이벤트 핸들러 설정
   * @param {Object} flay Flay 객체
   */
  #initializeElements(flay) {
    // 삭제 버튼
    this.querySelector('.empty-this').addEventListener('click', () => this.#fadeOut(flay.opus));

    // 코멘트와 제목
    this.querySelector('.comment').textContent = flay.video.comment || '';
    const titleEl = this.querySelector('.popup-flay');
    titleEl.textContent = flay.title;
    titleEl.addEventListener('click', () => this.popup());

    // 배우 목록
    this.#renderActressList(flay.actressList || []);

    // 태그 목록
    this.#renderTags(flay.video.tags || []);
  }

  /**
   * 배우 목록 렌더링
   * @param {Array} actressList 배우 목록
   */
  #renderActressList(actressList) {
    const actressEl = this.querySelector('.actress');

    if (!actressList.length) {
      actressEl.textContent = 'No actress';
      return;
    }

    // 배우 요소 생성
    const fragment = document.createDocumentFragment();

    actressList.forEach((name) => {
      const a = document.createElement('a');
      a.textContent = name;
      a.title = `View actress: ${name}`;
      a.addEventListener('click', (e) => {
        e.stopPropagation();
        popupActress(name);
      });
      fragment.appendChild(a);
    });

    actressEl.appendChild(fragment);
  }

  /**
   * 태그 목록 렌더링
   * @param {Array} tags 태그 목록
   */
  #renderTags(tags) {
    const tagsEl = this.querySelector('.tags');

    if (!tags.length) return;

    // 등급 관련 태그 필터링 (50, 63, 64, 65, 66)
    const filteredTags = tags.filter((tag) => ![50, 63, 64, 65, 66].includes(tag.id));

    if (!filteredTags.length) return;

    // 태그 요소 생성
    const fragment = document.createDocumentFragment();

    filteredTags.forEach((tag) => {
      const a = document.createElement('a');
      a.textContent = tag.name;
      a.title = `View tag: ${tag.name}`;
      a.addEventListener('click', (e) => {
        e.stopPropagation();
        popupTag(tag.id);
      });
      fragment.appendChild(a);
    });

    tagsEl.appendChild(fragment);
  }

  /**
   * 커버 이미지 로드
   * @param {String} opus Flay opus
   */
  async #loadCoverImage(opus) {
    try {
      const url = await FlayFetch.getCoverURL(opus);
      const coverEl = this.querySelector('.cover');

      // 이미지 미리 로드 후 배경으로 설정
      const img = new Image();
      img.onload = () => {
        coverEl.style.backgroundImage = `url(${url})`;
        coverEl.classList.add('loaded');
      };
      img.onerror = () => {
        coverEl.classList.add('error');
        coverEl.setAttribute('title', 'Failed to load cover image');
      };
      img.src = url;
    } catch (error) {
      console.error(`Failed to load cover for ${opus}:`, error);
      this.querySelector('.cover').classList.add('error');
    }
  }

  /**
   * 아이템 삭제 (자연스럽게 사라지는 애니메이션)
   * @param {String} opus Flay opus
   */
  async #fadeOut(opus) {
    try {
      // 자연스럽게 사라지는 애니메이션
      await this.animate(
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0.95)', opacity: 0.8 },
          { transform: 'scale(0.9)', opacity: 0.6 },
          { transform: 'scale(0.85)', opacity: 0.4 },
          { transform: 'scale(0.8)', opacity: 0.2 },
          { transform: 'scale(0)', opacity: 0 },
        ],
        {
          duration: 800,
          easing: 'ease-out',
          fill: 'forwards',
        }
      ).finished;

      // 공통 삭제 로직 호출
      this.#removeFromBasket(opus);
    } catch (error) {
      console.error(`Failed to fade out ${opus}:`, error);
    }
  }

  /**
   * 아이템 삭제 및 팝업 애니메이션 처리
   * @param {String} opus Flay opus
   */
  async #delete(opus) {
    try {
      // 요소를 다른 요소 위에 표시하기 위해 z-index 설정
      const originalPosition = this.style.position;
      const originalZIndex = this.style.zIndex;

      this.style.position = 'relative';
      this.style.zIndex = '10000';

      // 단순화된 애니메이션: 제자리에서 커지다가 사라짐
      await this.animate(
        [
          // 시작: 원래 크기
          { transform: 'scale(1)', opacity: 1 },
          // 약간 커짐
          { transform: 'scale(1.3)', opacity: 0.9 },
          // 더 커지면서 투명해지기 시작
          { transform: 'scale(1.8)', opacity: 0.7 },
          // 크게 확대되면서 투명해짐
          { transform: 'scale(2.5)', opacity: 0.3 },
          // 완전히 커지고 사라짐
          { transform: 'scale(3)', opacity: 0 },
        ],
        {
          duration: 600,
          easing: 'ease-in-out',
          fill: 'forwards',
        }
      ).finished;

      // 원래 스타일 복원
      this.style.position = originalPosition;
      this.style.zIndex = originalZIndex;

      // 공통 삭제 로직 호출
      this.#removeFromBasket(opus);
    } catch (error) {
      console.error(`Failed to delete ${opus}:`, error);
    }
  }

  /**
   * 바스켓에서 항목 제거 및 이벤트 발생 (공통 로직)
   * @param {String} opus Flay opus
   */
  #removeFromBasket(opus) {
    // 바스켓에서 제거
    FlayBasket.remove(opus);

    // 삭제 이벤트 발생
    this.dispatchEvent(
      new CustomEvent('delete', {
        bubbles: true,
        composed: true,
        detail: { opus },
      })
    );
  }

  /**
   * 팝업으로 Flay 보기
   */
  async popup() {
    try {
      await this.#delete(this.id);
      popupFlay(this.id);
    } catch (error) {
      console.error(`Failed to popup ${this.id}:`, error);
    }
  }

  /**
   * 특정 배우 포함 여부 확인
   * @param {String} name 배우 이름
   * @returns {Boolean} 포함 여부
   */
  hasActress(name) {
    return this.actressList.includes(name);
  }

  /**
   * 배우 목록 가져오기
   * @returns {Array} 배우 목록
   */
  get actressList() {
    return Array.from(this.querySelectorAll('.actress a')).map((a) => a.textContent);
  }
}
customElements.define('flay-basket-item', FlayBasketItem, { extends: 'div' });

/**
 *
 * @returns {Set<string>} basket
 */
function getBasket() {
  return new Set(FlayStorage.local.getArray(BASKET_KEY));
}

/**
 *
 * @param {Set<string>} basket
 */
function setBasket(basket) {
  FlayStorage.local.setArray(BASKET_KEY, Array.from(basket));
}
