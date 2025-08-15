import FlayDiv from '@base/FlayDiv';
import FlayFetch from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import { addResizeListener } from '@lib/windowAddEventListener';
import './FlayPagination.scss';

const NEXT = 'NEXT' as const;
const PREV = 'PREV' as const;
const RANDOM = 'RANDOM' as const;
const FIRST = 'FIRST' as const;
const LAST = 'LAST' as const;
const PAGEUP = 'PAGEUP' as const;
const PAGEDOWN = 'PAGEDOWN' as const;
const BACK = 'BACK' as const;

type NavigationDirection = typeof NEXT | typeof PREV | typeof RANDOM | typeof FIRST | typeof LAST | typeof PAGEUP | typeof PAGEDOWN | typeof BACK;

interface VideoPlayerEventDetail {
  isPlay: boolean;
}

/**
 * 페이지 표현
 */
export default class FlayPagination extends FlayDiv {
  /** 현재 선택된 opus */
  opus: string | null | undefined = null;
  /** 현재 opus의 인덱스 */
  opusIndex: number = -1;
  /** opus 목록 */
  opusList: string[] = [];
  /** 활성화 상태 */
  active: boolean = true;
  /** 히스토리 */
  history: number[] = [];
  /** 페이지 범위 */
  pageRange: number = 0;
  /** 랜덤 팝업 개수 */
  randomEnd: number = 6;
  /** 마지막 타이핑 시간 */
  lastTypedTime: number = -1;
  /** 페이징 컨테이너 */
  paging: HTMLDivElement;
  /** 진행바 */
  progressBar: HTMLDivElement;
  /** 커버 썸네일 */
  coverThumbnail: HTMLDivElement;

  constructor() {
    super();

    this.innerHTML = `
      <div class="paging"></div>
      <div class="progress">
        <div class="progress-bar"></div>
      </div>
      <div class="cover-thumbnail">
        <div class="top-left"></div>   <div class="top-right"></div>
        <div class="bottom-left"></div><div class="bottom-right"></div>
      </div>
      <button type="button" class="side-btn random-popup-button" title="popup random Flay">${this.randomEnd}</button>
      <button type="button" class="side-btn random-flow-button" title="flow random">F</button>
    `;

    this.paging = this.querySelector('.paging') as HTMLDivElement;
    this.progressBar = this.querySelector('.progress-bar') as HTMLDivElement;
    this.coverThumbnail = this.querySelector('.cover-thumbnail') as HTMLDivElement;

    if (!this.paging || !this.progressBar || !this.coverThumbnail) {
      throw new Error('Required DOM elements not found');
    }
  }

  connectedCallback(): void {
    const randomPopupButton = this.querySelector('.random-popup-button') as HTMLButtonElement;
    const randomFlowButton = this.querySelector('.random-flow-button') as HTMLButtonElement;

    if (!randomPopupButton || !randomFlowButton) {
      throw new Error('Required button elements not found');
    }

    document.addEventListener('videoPlayer', (e: Event) => {
      const customEvent = e as CustomEvent<VideoPlayerEventDetail>;
      this.active = !customEvent.detail.isPlay;
    });

    window.addEventListener('wheel', (e: WheelEvent) => {
      if (!this.active) return false;
      if (e.ctrlKey) return false;
      if ((e.target as Element)?.closest('#layer')) return false;
      if ((e.target as Element)?.closest('.side-nav-bar')) return false;

      return this.#navigator(e.deltaY > 0 ? NEXT : PREV);
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      e.stopPropagation();
      if (!this.active) return false;

      if (e.code.startsWith('Numpad') || e.code.startsWith('Digit')) {
        if (randomPopupButton.classList.contains('input-mode')) {
          const continueType = this.lastTypedTime > 0 && Date.now() - this.lastTypedTime < 1000 * 1;
          if (continueType) {
            randomPopupButton.innerHTML += e.key;
          } else {
            randomPopupButton.innerHTML = e.key;
          }
          this.randomEnd = Number(randomPopupButton.innerHTML);

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

    window.addEventListener('mouseup', (e: MouseEvent) => {
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
    }, true);

    randomPopupButton.addEventListener('mouseover', () => randomPopupButton.classList.add('input-mode'));
    randomPopupButton.addEventListener('mouseout', () => randomPopupButton.classList.remove('input-mode'));
    randomPopupButton.addEventListener('click', async () => {
      this.querySelector('aside')?.remove();
      const popupIndicators = this.appendChild(document.createElement('aside'));
      const randomCount = Math.min(this.randomEnd, this.opusList.length);
      const currOpusIndex = this.opusIndex;

      for (let i = 0; i < randomCount; i++) {
        this.#decideOpus(RANDOM);
        let randomPopup = window.open(`popup.flay.html?opus=${this.opus}&popupNo=${i + 1}`, `randomPopup.${i}`, 'width=800px,height=1280px');

        randomPopupButton.innerHTML = String(randomCount - i);
        randomPopupButton.animate([{ transform: 'scale(1.5)' }, { transform: 'none' }], { duration: 500, iterations: 1 });

        const popupIndicator = popupIndicators.appendChild(document.createElement('button'));
        popupIndicator.innerHTML = String(i + 1);
        popupIndicator.addEventListener('mouseover', () => randomPopup?.postMessage('over'));
        popupIndicator.addEventListener('mouseout', () => randomPopup?.postMessage('out'));
        popupIndicator.addEventListener('click', () => {
          this.#decideOpus(RANDOM);
          randomPopup = window.open(`popup.flay.html?opus=${this.opus}&popupNo=${i + 1}`, `randomPopup.${i}`, 'width=800px,height=1280px');

          popupIndicator.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 500, iterations: 1 });
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      randomPopupButton.innerHTML = String(randomCount);
      this.opusIndex = currOpusIndex;
    });

    const INTERVAL = 10;
    let randomFlowInterval: ReturnType<typeof setInterval> | undefined;
    randomFlowButton.addEventListener('click', () => {
      randomFlowButton.animate([{ transform: 'scale(1.5)' }, { transform: 'none' }], { duration: 500, iterations: 1 });
      if (randomFlowButton.toggleAttribute('start')) {
        let countDown = INTERVAL;
        randomFlowInterval = setInterval(() => {
          randomFlowButton.innerHTML = String(--countDown);
          if (countDown === 0) {
            randomFlowButton.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 400, iterations: 1 });
            this.#navigator(RANDOM);
            countDown = INTERVAL;
          }
        }, 1000);
      } else {
        randomFlowButton.innerHTML = 'F';
        clearInterval(randomFlowInterval);
      }
    });
  }

  /**
   * set opus list
   * @param {string[]} list of opus
   */
  set(list: string[]): void {
    this.opusList = list;
    this.history = [];
    this.#navigator(this.opus ?? RANDOM);
  }

  /**
   * opus 가져오기
   * @param offset 현재 위치로부터의 오프셋
   * @returns opus 문자열 또는 null
   */
  get(offset?: number): string | null | undefined {
    if (offset) {
      return this.opusList[this.opusIndex + offset] ?? null;
    } else {
      return this.opus;
    }
  }

  /**
   * 활성화
   */
  on(): void {
    this.active = true;
  }

  /**
   * 비활성화
   */
  off(): void {
    this.active = false;
  }

  /**
   * 페이지 이동을 결정하고, 이벤트 발생
   * @param direction 방향 또는 인덱스
   * @returns 성공 여부
   */
  #navigator(direction: NavigationDirection | string | number): boolean {
    this.#decideOpus(direction);
    this.dispatchEvent(new Event('change'));
    this.#display();
    return true;
  }

  /**
   * opus 위치 결정
   * @param direction 방향 또는 인덱스
   */
  #decideOpus(direction: NavigationDirection | string | number): void {
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
          this.opusIndex = RandomUtils.getRandomInt(0, this.opusList.length);
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
          // 품번이라고 가정
          this.opusIndex = this.opusList.indexOf(direction);
          if (this.opusIndex === -1) {
            this.#decideOpus(RANDOM);
          }
          break;
      }
    } else if (typeof direction === 'number') {
      this.opusIndex = direction;
    }

    this.opus = this.opusList[this.opusIndex];

    console.debug('navigator: index', this.opusIndex, 'opus', this.opus);
    console.debug('history', this.history);
  }

  /**
   * 히스토리 관리
   * @param index 인덱스
   * @returns 추가되면 true
   */
  #putHistory(index: number): boolean {
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
   */
  #display(): void {
    if (!this.opusList) {
      throw new Error('opusList is not valid');
    }

    if (this.opusList.length === 0) {
      this.progressBar.style.width = String(0);
      this.paging.textContent = null;
      return;
    }

    const lastIndex = this.opusList.length - 1;
    this.progressBar.style.width = `${((this.opusIndex + 1) / this.opusList.length) * 100}%`;

    const [width, height] = [window.innerWidth, window.innerHeight];
    if (height >= 1900) {
      this.pageRange = width > 1440 ? 20 : 15;
    } else {
      this.pageRange = width > 1440 ? 30 : 15;
    }

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
    for (const i of pageRange) {
      const page = this.paging.appendChild(document.createElement('label'));
      page.classList.add('page');
      page.classList.toggle('disable', i > lastIndex);
      page.classList.toggle('active', i === this.opusIndex);
      page.innerHTML = `<a>${i + 1}</a>`;
      if (i <= lastIndex) {
        page.addEventListener('click', () => {
          this.#navigator(i);
          this.coverThumbnail.classList.remove('show');
        });
        page.addEventListener('mouseleave', () => this.coverThumbnail.classList.remove('show'));
        page.addEventListener('mouseenter', () => {
          if (page.classList.contains('active')) {
            return;
          }
          const opus = this.opusList[i];
          if (!opus) return;

          const domRect = page.getBoundingClientRect();
          const coverWidth = domRect.width * 6;

          this.coverThumbnail.classList.add('show');
          FlayFetch.getCoverURL(opus)
            .then((url: string) => {
              if (url) {
                this.coverThumbnail.style.backgroundImage = `url(${url})`;
              }
            })
            .catch((error: unknown) => {
              console.error('Failed to load cover image:', error);
            });
          this.coverThumbnail.style.width = `${coverWidth}px`;
          this.coverThumbnail.style.bottom = `${window.innerHeight - domRect.y}px`;
          this.coverThumbnail.style.left = `${domRect.x + domRect.width / 2 - coverWidth / 2}px`;
        });
      }
    }
  }
}

customElements.define('flay-pagination', FlayPagination);
