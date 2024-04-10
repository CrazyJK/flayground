import { getRandomInt } from '../../util/randomNumber';
import { addResizeLazyEventListener } from '../../util/resizeListener';
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
export default class FlayPagination extends HTMLElement {
  opus = null;
  opusIndex = -1;
  opusList = null;
  active = true;
  history = [];

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = `
      <div class="paging"></div>
      <div class="progress">
        <div class="progress-bar"></div>
      </div>
      <div class="cover-thumbnail">
        <div class="top-left"></div>   <div class="top-right"></div>
        <div class="bottom-left"></div><div class="bottom-right"></div>
      </div>
    `;

    this.paging = wrapper.querySelector('.paging');
    this.progressBar = wrapper.querySelector('.progress-bar');
    this.coverThumbnail = wrapper.querySelector('.cover-thumbnail');
  }

  connectedCallback() {
    window.addEventListener('wheel', (e) => {
      if (!this.active) return;
      if (e.ctrlKey) return;
      if (e.target.closest('#layer')) return;

      switch (e.deltaY) {
        case 100: // wheel down
          return this.#navigator(NEXT);
        case -100: // wheel up
          return this.#navigator(PREV);
      }
    });

    window.addEventListener('keyup', (e) => {
      e.stopPropagation();
      if (!this.active) return;

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
    });

    window.addEventListener('mouseup', (e) => {
      if (!this.active) return;
      /*
      MouseEvent: button
        0: Main button pressed, usually the left button or the un-initialized state
        1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
        2: Secondary button pressed, usually the right button
        3: Fourth button, typically the Browser Back button
        4: Fifth button, typically the Browser Forward button
      */
      if (e.button === 1) this.#navigator(RANDOM);
    });

    addResizeLazyEventListener(() => {
      this.#display();
    });
  }

  /**
   * set opus list
   * @param {string[]} list
   */
  set(list) {
    this.opusList = list;
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
    if (typeof direction === 'string') {
      switch (direction) {
        case NEXT:
          this.opusIndex = Math.min(this.opusIndex + 1, this.opusList.length - 1);
          this.history.push(this.opusIndex);
          break;
        case PREV:
          this.opusIndex = Math.max(this.opusIndex - 1, 0);
          this.history.push(this.opusIndex);
          break;
        case RANDOM:
          this.opusIndex = getRandomInt(0, this.opusList.length);
          if (this.history.length > this.opusList.length) {
            this.history = [];
          }
          if (this.history.includes(this.opusIndex)) {
            this.#navigator(RANDOM);
          }
          this.history.push(this.opusIndex);
          break;
        case FIRST:
          this.opusIndex = 0;
          this.history.push(this.opusIndex);
          break;
        case LAST:
          this.opusIndex = this.opusList.length - 1;
          this.history.push(this.opusIndex);
          break;
        case PAGEUP:
          this.opusIndex = Math.max(this.opusIndex - 10, 0);
          this.history.push(this.opusIndex);
          break;
        case PAGEDOWN:
          this.opusIndex = Math.min(this.opusIndex + 10, this.opusList.length - 1);
          this.history.push(this.opusIndex);
          break;
        case BACK:
          this.opusIndex = this.history.splice(this.history.length - 2, 1)[0];
          break;
        default:
          throw new Error('unknown direction');
      }
    } else if (typeof direction === 'number') {
      this.opusIndex = direction;
    }

    this.opus = this.opusList[this.opusIndex];
    console.debug('history', this.history, this.opusIndex, this.opus);

    if (!this.opus) {
      console.error('opus is not valid', this.opus);
      return false;
    }

    this.dispatchEvent(new Event('change'));
    return this.#display();
  }

  /**
   * 페이징 화면 렌더링
   * @returns
   */
  #display() {
    if (!this.opusList) {
      return false;
    }
    const lastIndex = this.opusList.length - 1;
    this.progressBar.style.width = `${(this.opusIndex / lastIndex) * 100}%`;

    const domRect = this.getBoundingClientRect();
    const RANGE = domRect.width > 1200 ? 30 : 15;
    const currPageNo = Math.ceil((this.opusIndex + 1) / RANGE);
    const lastPageNo = Math.ceil(this.opusList.length / RANGE);
    const pageRange = [];
    if (1 < currPageNo) {
      pageRange.push(0);
    }
    for (let i = 0; i < RANGE; i++) {
      pageRange.push((currPageNo - 1) * RANGE + i);
    }
    if (currPageNo < lastPageNo) {
      pageRange.push(lastIndex);
    }
    console.debug('pageRange', pageRange, currPageNo, lastPageNo);

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
    return true;
  }
}

// Define the new element
customElements.define('flay-pagination', FlayPagination);
