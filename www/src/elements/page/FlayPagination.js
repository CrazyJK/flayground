const NEXT = 'NEXT';
const PREV = 'PREV';
const RANDOM = 'RANDOM';
const FIRST = 'FIRST';
const LAST = 'LAST';
const PAGEUP = 'PAGEUP';
const PAGEDOWN = 'PAGEDOWN';

/**
 *
 */
export default class FlayPagination extends HTMLElement {
  constructor(listener) {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('pagination');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');
    this.shadowRoot.append(link, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.opus = null;
    this.opusIndex = -1;
    this.opusList = null;
    this.listener = listener;
    this.active = true;

    this.PAGING = this.wrapper.appendChild(document.createElement('div'));
    this.PAGING.classList.add('paging');

    const PROGRESS = this.wrapper.appendChild(document.createElement('div'));
    PROGRESS.classList.add('progress');
    this.PROGRESS_BAR = PROGRESS.appendChild(document.createElement('div'));
    this.PROGRESS_BAR.classList.add('progress-bar');

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
  }

  set(opusList) {
    this.opusList = opusList;
    this.navigator(RANDOM);
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
    if (direction) {
      switch (direction) {
        case NEXT:
          this.opusIndex = Math.min(this.opusIndex + 1, this.opusList.length - 1);
          break;
        case PREV:
          this.opusIndex = Math.max(this.opusIndex - 1, 0);
          break;
        case RANDOM:
          this.opusIndex = Math.floor(Math.random() * this.opusList.length);
          break;
        case FIRST:
          this.opusIndex = 0;
          break;
        case LAST:
          this.opusIndex = this.opusList.length - 1;
          break;
        case PAGEUP:
          this.opusIndex = Math.max(this.opusIndex - 10, 0);
          break;
        case PAGEDOWN:
          this.opusIndex = Math.min(this.opusIndex + 10, this.opusList.length - 1);
          break;
        default:
          throw new Error('unknown direction');
      }
    }

    this.opus = this.opusList[this.opusIndex];

    this.render();
    if (this.listener) {
      this.listener(this.opus);
    }
  }

  render() {
    let lastIndex = this.opusList.length - 1;
    this.PROGRESS_BAR.style.width = `${(this.opusIndex / lastIndex) * 100}%`;

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
        console.log('pageClick', i);
        this.opusIndex = i;
        this.navigator();
      });

      const anker = page.appendChild(document.createElement('a'));
      anker.classList.toggle('active', i === this.opusIndex);
      anker.innerHTML = i + 1;
    }
  }
}

// Define the new element
customElements.define('flay-pagination', FlayPagination);
