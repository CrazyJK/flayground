import { addResizeLazyEventListener } from '../../util/windowResize';

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

    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    const WRAPPER = document.createElement('div');
    WRAPPER.classList.add('pagination');
    this.shadowRoot.append(LINK, STYLE, WRAPPER); // 생성된 요소들을 shadow DOM에 부착합니다

    this.render(WRAPPER);
  }

  render(wrapper) {
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

    addResizeLazyEventListener(() => {
      this.display();
    });
  }

  set(opusList) {
    this.opusList = opusList;
    if (!!opusList && opusList.length > 0) {
      this.navigator(RANDOM);
    } else {
      window.emitMessage('open is not valid', opusList);
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
          this.opusIndex = Math.floor(Math.random() * this.opusList.length);
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
    let lastIndex = this.opusList.length - 1;
    this.PROGRESS_BAR.style.width = `${(this.opusIndex / lastIndex) * 100}%`;

    let method = 0;
    if (method == 0) {
      let domRect = this.getBoundingClientRect();
      const RANGE = domRect.width > 1200 ? 20 : 10;
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

const CSS = `
/* for FlayPagination */
div.pagination .paging {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}
div.pagination .paging .page {
  position: relative;
  margin: 0;
  border: 1px solid #aaa;
  border-right: 0;
  padding: 0.25rem;
  line-height: 1.25rem;
  min-width: 2.5rem;
  font-size: var(--font-normal);
  cursor: pointer;
  text-align: center;
}
div.pagination .paging .page:last-child {
  border-right: 1px solid #aaa;
}
div.pagination .paging .page a {
  font-size: var(--font-small);
  font-weight: 700;
}
div.pagination .paging .page.disable a {
  color: var(--color-text-secondary);
}
div.pagination .paging .page:hover a {
  text-shadow: var(--text-shadow-hover);
}
div.pagination .paging .page a.active {
  color: var(--color-checked);
}
div.pagination .progress {
  position: relative;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
}
div.pagination .progress .progress-bar {
  position: relative;
  height: 1px;
  background-color: #f00;
}
`;
