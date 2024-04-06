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

export default class FlayPagination extends HTMLElement {
  opus = null;
  opusIndex = -1;
  opusList = null;
  active = true;
  history = [];

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());

    this.PAGING = wrapper.appendChild(document.createElement('div'));
    this.PAGING.classList.add('paging');

    const PROGRESS = wrapper.appendChild(document.createElement('div'));
    PROGRESS.classList.add('progress');
    this.PROGRESS_BAR = PROGRESS.appendChild(document.createElement('div'));
    this.PROGRESS_BAR.classList.add('progress-bar');
  }

  connectedCallback() {
    window.addEventListener('wheel', (e) => {
      if (!this.active) {
        return;
      }
      if (e.ctrlKey) {
        return;
      }
      let isInLayer = e.target.closest('#layer');
      if (isInLayer) {
        return;
      }
      console.debug('wheel', e.deltaY, e.target, e.target.closest('#layer'), e);
      switch (e.deltaY) {
        case 100: // wheel down
          this.navigator(NEXT);
          break;
        case -100: // wheel up
          this.navigator(PREV);
          break;
        default:
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      e.stopPropagation();
      if (!this.active) {
        return;
      }
      console.debug('keyup', e.code, e.target, e);
      switch (e.code) {
        case 'ArrowRight':
          this.navigator(NEXT);
          break;
        case 'ArrowLeft':
          this.navigator(PREV);
          break;
        case 'ArrowUp':
          this.navigator(BACK);
          break;
        case 'Space':
          this.navigator(RANDOM);
          break;
        case 'Home':
          this.navigator(FIRST);
          break;
        case 'End':
          this.navigator(LAST);
          break;
        case 'PageUp':
          this.navigator(PAGEUP);
          break;
        case 'PageDown':
          this.navigator(PAGEDOWN);
          break;
        default:
          break;
      }
    });

    window.addEventListener('mouseup', (e) => {
      console.debug(e.type, e.button, e);
      /*
      MouseEvent: button
        0: Main button pressed, usually the left button or the un-initialized state
        1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
        2: Secondary button pressed, usually the right button
        3: Fourth button, typically the Browser Back button
        4: Fifth button, typically the Browser Forward button
      */
      if (e.button === 1) {
        this.navigator(RANDOM);
      }
    });

    addResizeLazyEventListener(() => {
      this.display();
    });
  }

  /**
   * set opus list
   * @param {string[]} list
   */
  set(list) {
    this.opusList = list;
    if (!!this.opusList && this.opusList.length > 0) {
      this.navigator(RANDOM);
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

  navigator(direction) {
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
            this.navigator(RANDOM);
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
      return;
    }

    this.display();
    this.dispatchEvent(new CustomEvent('change'));
  }

  display() {
    if (!this.opusList) {
      return;
    }
    let lastIndex = this.opusList.length - 1;
    this.PROGRESS_BAR.style.width = `${(this.opusIndex / lastIndex) * 100}%`;

    let method = 0;
    if (method == 0) {
      let domRect = this.getBoundingClientRect();
      const RANGE = domRect.width > 1200 ? 30 : 15;
      let currPageNo = Math.ceil((this.opusIndex + 1) / RANGE);
      let lastPageNo = Math.ceil(this.opusList.length / RANGE);
      let pageRange = [];
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

      this.PAGING.textContent = null;
      for (let i of pageRange) {
        const page = this.PAGING.appendChild(document.createElement('label'));
        page.classList.add('page');
        if (i > lastIndex) {
          page.classList.add('disable');
        } else {
          page.addEventListener('click', () => {
            console.debug('pageClick', i);
            this.navigator(i);
          });
        }
        const anker = page.appendChild(document.createElement('a'));
        anker.classList.toggle('active', i === this.opusIndex);
        anker.innerHTML = i + 1;
      }
    } else {
      let start = Math.max(this.opusIndex - 5, 0);
      let end = Math.min(start + 10, lastIndex);
      let range = Array(end - start + 1)
        .fill(start)
        .map((x, y) => x + y);
      if (range[0] > 0) {
        range.unshift(0);
      }
      if (range[range.length - 1] < lastIndex) {
        range.push(lastIndex);
      }

      this.PAGING.textContent = null;
      for (let i of range) {
        const page = this.PAGING.appendChild(document.createElement('label'));
        page.classList.add('page');
        page.addEventListener('click', () => {
          console.debug('pageClick', i);
          this.navigator(i);
        });
        const anker = page.appendChild(document.createElement('a'));
        anker.classList.toggle('active', i === this.opusIndex);
        anker.innerHTML = i + 1;
      }
    }
  }
}

// Define the new element
customElements.define('flay-pagination', FlayPagination);
