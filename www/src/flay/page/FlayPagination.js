import { getRandomInt } from '../../util/randomNumber';
import { addResizeListener } from '../../util/windowAddEventListener';
import './FlayPagination.scss';

const NEXT = 'NEXT';
const PREV = 'PREV';
const RANDOM = 'RANDOM';
const FIRST = 'FIRST';
const LAST = 'LAST';
const PAGEUP = 'PAGEUP';
const PAGEDOWN = 'PAGEDOWN';
const BACK = 'BACK';

/**
 * 페이지 표현
 */
export default class FlayPagination extends HTMLDivElement {
  opus = null;
  opusIndex = -1;
  opusList = [];
  active = true;
  history = [];
  pageRange = 0;
  randomEnd = 6;
  lastTypedTime = -1;

  constructor() {
    super();

    this.classList.add('flay-pagination');
    this.innerHTML = `
      <div class="paging"></div>
      <div class="progress">
        <div class="progress-bar"></div>
      </div>
      <div class="cover-thumbnail">
        <div class="top-left"></div>   <div class="top-right"></div>
        <div class="bottom-left"></div><div class="bottom-right"></div>
      </div>
      <button class="random-popup-button">${this.randomEnd}</button>
    `;

    this.paging = this.querySelector('.paging');
    this.progressBar = this.querySelector('.progress-bar');
    this.coverThumbnail = this.querySelector('.cover-thumbnail');
    this.randomPopupButton = this.querySelector('.random-popup-button');
  }

  connectedCallback() {
    document.addEventListener('videoPlayer', (e) => (this.active = !e.detail.isPlay));

    window.addEventListener('wheel', (e) => {
      if (!this.active) return false;
      if (e.ctrlKey) return false;
      if (e.target.closest('#layer')) return false;
      if (e.target.closest('side-nav')) return false;

      return this.#navigator(e.deltaY > 0 ? NEXT : PREV);
    });

    window.addEventListener('keyup', (e) => {
      e.stopPropagation();
      if (!this.active) return false;

      if (e.code.startsWith('Numpad') || e.code.startsWith('Digit')) {
        if (this.randomPopupButton.classList.contains('input-mode')) {
          const continueType = this.lastTypedTime > 0 && Date.now() - this.lastTypedTime < 1000 * 1;
          if (continueType) {
            this.randomPopupButton.innerHTML += e.key;
          } else {
            this.randomPopupButton.innerHTML = e.key;
          }
          this.randomEnd = Number(this.randomPopupButton.innerHTML);

          this.lastTypedTime = Date.now();
        }
      }

      switch (e.code) {
        case 'ArrowRight':
          return this.#navigator(NEXT);
        case 'ArrowLeft':
          return this.#navigator(PREV);
        case 'ArrowUp':
          return this.#navigator(BACK);
        case 'Space':
          return this.#navigator(RANDOM);
        case 'Home':
          return this.#navigator(FIRST);
        case 'End':
          return this.#navigator(LAST);
        case 'PageUp':
          return this.#navigator(PAGEUP);
        case 'PageDown':
          return this.#navigator(PAGEDOWN);
      }
      return false;
    });

    window.addEventListener('mouseup', (e) => {
      e.preventDefault();
      if (!this.active) return false;

      /* MouseEvent: button */
      switch (e.button) {
        case 0: // 0: Main button pressed, usually the left button or the un-initialized state
          break;
        case 1: // 1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
          return this.#navigator(RANDOM);
        case 2: // 2: Secondary button pressed, usually the right button
          break;
        case 3: // 3: Fourth button, typically the Browser Back button
          return this.#navigator(NEXT);
        case 4: // 4: Fifth button, typically the Browser Forward button
          return this.#navigator(PREV);
      }
      return false;
    });

    addResizeListener(() => {
      this.#display();
    });

    this.randomPopupButton.addEventListener('mouseover', () => this.randomPopupButton.classList.add('input-mode'));
    this.randomPopupButton.addEventListener('mouseout', () => this.randomPopupButton.classList.remove('input-mode'));
    this.randomPopupButton.addEventListener('click', async () => {
      this.querySelector(`.${this.tagName.toLowerCase()} aside`)?.remove();
      const popupIndicators = this.querySelector(`.${this.tagName.toLowerCase()}`).appendChild(document.createElement('aside'));
      const randomCount = Math.min(this.randomEnd, this.opusList.length);
      const currOpusIndex = this.opusIndex;

      for (let i = 0; i < randomCount; i++) {
        this.#decideOpus(RANDOM);
        let randomPopup = window.open(`popup.flay.html?opus=${this.opus}&popupNo=${i + 1}`, `randomPopup.${i}`, 'width=800px,height=1280px');

        this.randomPopupButton.innerHTML = randomCount - i;
        this.randomPopupButton.animate([{ transform: 'scale(1.5)' }, { transform: 'none' }], { duration: 500, iterations: 1 });

        const popupIndicator = popupIndicators.appendChild(document.createElement('button'));
        popupIndicator.innerHTML = i + 1;
        popupIndicator.addEventListener('mouseover', () => randomPopup.postMessage('over'));
        popupIndicator.addEventListener('mouseout', () => randomPopup.postMessage('out'));
        popupIndicator.addEventListener('click', () => {
          this.#decideOpus(RANDOM);
          randomPopup = window.open(`popup.flay.html?opus=${this.opus}&popupNo=${i + 1}`, `randomPopup.${i}`, 'width=800px,height=1280px');

          popupIndicator.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 500, iterations: 1 });
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.randomPopupButton.innerHTML = randomCount;
      this.opusIndex = currOpusIndex;
    });
  }

  /**
   * set opus list
   * @param {string[]} list of opus
   */
  set(list) {
    this.opusList = list;
    this.history = [];
    if (!!this.opusList && this.opusList.length > 0) {
      this.#navigator(RANDOM);
    } else {
      window.emitMessage('검색 결과가 없습니다.');
    }
  }

  get(offset) {
    if (offset) {
      return this.opusList[this.opusIndex + offset];
    } else {
      return this.opus;
    }
  }

  on() {
    this.active = true;
  }

  off() {
    this.active = false;
  }

  /**
   * 페이지 이동을 결정하고, 이벤트 발생
   * @param {*} direction 방향 또는 인덱스
   * @returns
   */
  #navigator(direction) {
    this.#decideOpus(direction);
    this.dispatchEvent(new Event('change'));
    this.#display();
    return true;
  }

  #decideOpus(direction) {
    if (typeof direction === 'string') {
      switch (direction) {
        case NEXT:
          this.opusIndex = Math.min(this.opusIndex + 1, this.opusList.length - 1);
          this.#putHistory(this.opusIndex);
          break;
        case PREV:
          this.opusIndex = Math.max(this.opusIndex - 1, 0);
          this.#putHistory(this.opusIndex);
          break;
        case RANDOM:
          this.opusIndex = getRandomInt(0, this.opusList.length);
          if (!this.#putHistory(this.opusIndex)) {
            this.#decideOpus(direction);
          }
          break;
        case FIRST:
          this.opusIndex = 0;
          this.#putHistory(this.opusIndex);
          break;
        case LAST:
          this.opusIndex = this.opusList.length - 1;
          this.#putHistory(this.opusIndex);
          break;
        case PAGEUP:
          this.opusIndex = Math.max(this.opusIndex - this.pageRange, 0);
          this.#putHistory(this.opusIndex);
          break;
        case PAGEDOWN:
          this.opusIndex = Math.min(this.opusIndex + this.pageRange, this.opusList.length - 1);
          this.#putHistory(this.opusIndex);
          break;
        case BACK: {
          const backIndex = this.history.splice(this.history.length - 2, 1)[0];
          if (typeof backIndex !== 'undefined') {
            this.opusIndex = backIndex;
          }
          break;
        }
        default:
          throw new Error('unknown direction');
      }
    } else if (typeof direction === 'number') {
      this.opusIndex = direction;
    }

    this.opus = this.opusList[this.opusIndex];
    if (!this.opus) {
      throw new Error(`navigator: index=${this.opusIndex}, opus=${this.opus}`);
    }
    console.debug(`navigator: index=${this.opusIndex}, opus=${this.opus}`);
    console.debug('history', this.history);
  }

  /**
   * 히스토리 관리
   * @param {number} index
   * @returns 추가되면 true
   */
  #putHistory(index) {
    if (this.history.length === this.opusList.length) {
      this.history = [];
    }
    if (this.history.includes(index)) {
      return false;
    }
    this.history.push(index);
    return true;
  }

  /**
   * 페이징 화면 렌더링
   * @returns
   */
  #display() {
    if (!this.opusList) {
      throw new Error('opusList is not valid');
    }

    const lastIndex = this.opusList.length - 1;
    this.progressBar.style.width = `${(this.opusIndex / lastIndex) * 100}%`;

    const domRect = this.getBoundingClientRect();
    this.pageRange = domRect.width > 1200 ? 30 : 15;

    const currPageNo = Math.ceil((this.opusIndex + 1) / this.pageRange);
    const lastPageNo = Math.ceil(this.opusList.length / this.pageRange);
    const pageRange = [];
    if (1 < currPageNo) {
      pageRange.push(0);
    }
    for (let i = 0; i < this.pageRange; i++) {
      pageRange.push((currPageNo - 1) * this.pageRange + i);
    }
    if (currPageNo < lastPageNo) {
      pageRange.push(lastIndex);
    }
    console.debug('pageRange', pageRange);
    console.debug(`page: ${currPageNo} / ${lastPageNo}`);

    this.paging.textContent = null;
    for (let i of pageRange) {
      const page = this.paging.appendChild(document.createElement('label'));
      page.classList.add('page');
      page.classList.toggle('disable', i > lastIndex);
      page.classList.toggle('active', i === this.opusIndex);
      page.innerHTML = `<a>${i + 1}</a>`;
      if (i <= lastIndex) {
        page.addEventListener('click', () => this.#navigator(i));
        page.addEventListener('mouseleave', () => this.coverThumbnail.classList.remove('show'));
        page.addEventListener('mouseenter', () => {
          if (page.classList.contains('active')) {
            return;
          }
          const opus = this.opusList[i];
          const domRect = page.getBoundingClientRect();
          const coverWidth = domRect.width * 6;

          this.coverThumbnail.classList.add('show');
          this.coverThumbnail.style.backgroundImage = `url(/static/cover/${opus})`;
          this.coverThumbnail.style.width = `${coverWidth}px`;
          this.coverThumbnail.style.bottom = `${window.innerHeight - domRect.y}px`;
          this.coverThumbnail.style.left = `${domRect.x + domRect.width / 2 - coverWidth / 2}px`;
        });
      }
    }
  }
}

customElements.define('flay-pagination', FlayPagination, { extends: 'div' });
