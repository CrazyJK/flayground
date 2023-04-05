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
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('pagination');
    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');
    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.opus = null;
    this.opusIndex = -1;
    this.opusList = null;
    this.handler = null;

    this.paging = this.wrapper.appendChild(document.createElement('div'));
    this.paging.classList.add('paging');

    this.progress = this.wrapper.appendChild(document.createElement('div'));
    this.progress.classList.add('progress');
    this.progressBar = this.progress.appendChild(document.createElement('div'));
    this.progressBar.classList.add('progress-bar');

    window.addEventListener('wheel', (e) => {
      console.log('PageNavigator.wheel', e.deltaY, e);
      if (e.ctrlKey) {
        return;
      }
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
      console.log('PageNavigator.keyup', e.code, e);
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

    // Fallback for browsers that don't support View Transitions:
    if (!document.startViewTransition) {
      this.handler(this.opus);
      return;
    }

    // With View Transitions:
    const transition = document.startViewTransition(() => this.handler(this.opus));
    console.debug('transition', transition);

    this.render();
  }

  setData(opusList) {
    console.log('set', opusList);
    this.opusList = opusList;
  }

  setHandler(handler) {
    console.log('setHandler', handler);
    this.handler = handler;
  }

  start() {
    this.navigator(RANDOM);
  }

  render() {
    let lastIndex = this.opusList.length - 1;
    this.progressBar.style.width = `${(this.opusIndex / lastIndex) * 100}%`;

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

    this.paging.textContent = null;
    for (let i of range) {
      const page = this.paging.appendChild(document.createElement('label'));
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
