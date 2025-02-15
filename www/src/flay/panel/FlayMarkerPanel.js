import FlayFetch from '../../lib/FlayFetch';
import { getRandomInt, getRandomIntInclusive } from '../../lib/randomNumber';
import { addResizeListener } from '../../lib/windowAddEventListener';
import { EVENT_TIMER_END, EVENT_TIMER_START, EVENT_TIMER_TICK, TickTimer } from '../../ui/TickTimer';
import FlayMarker from '../domain/FlayMarker';
import './FlayMarkerPanel.scss';

/** 8방향 */
const AllDirections = [
  /** up */ [0, -1],
  /** down */ [0, 1],
  /** left */ [-1, 0],
  /** right */ [1, 0],
  /** up-left */ [-1, -1],
  /** up-right */ [1, -1],
  /** down-left */ [-1, 1],
  /** down-right */ [1, 1],
];
/** 대각선 방향 */
const DiagonalDirections = AllDirections.filter((d) => d[0] !== 0 && d[1] !== 0);
/** 기본 옵션 */
const DEFAULT_OPTIONS = {
  /** 시간 배수 */ multifier: [1, 3],
  /** 타이머 시간. s */ seconds: [50, 70],
  /** 스레드 개수 */ thread: [1, 3],
  /** 나타나는 시간 간격. ms */ interval: [200, 500],
  /** 모양. square, circle, star, heart */ shape: 'star',
  /** marker 크기. 1부터 0.5step */ size: 1,
};

export class FlayMarkerPanel extends HTMLDivElement {
  #maxX = 0;
  #maxY = 0;
  #n = -1;
  #paused = false;
  #threadCount = 1;
  #timerID = new Array(this.#threadCount);
  #opts = {};
  #methodIndex = 0;

  /**
   *
   * @param {DEFAULT_OPTIONS} options 각 항목의 [min, max] 값
   */
  constructor(options) {
    super();

    this.#opts = { ...DEFAULT_OPTIONS, ...options };
    this.classList.add('flay-marker-panel');
    this.dataset.w = this.#opts.size;

    this.tickTimer = new TickTimer();
    this.tickTimer.addEventListener(EVENT_TIMER_START, () => this.#render());
    this.tickTimer.addEventListener(EVENT_TIMER_END, () => this.#start());
    this.tickTimer.addEventListener(EVENT_TIMER_TICK, (e) => (this.dataset.seconds = e.detail.seconds));

    addResizeListener(() => this.#setRelativePositions());

    this.addEventListener('click', (e) => {
      if (e.target === this) this.#togglePause();
    });
    this.addEventListener('wheel', (e) => {
      this.dataset.w = this.#opts.size = e.deltaY < 0 ? Math.min(this.#opts.size + 0.5, 20) : Math.max(this.#opts.size - 0.5, 1);
    });
  }

  connectedCallback() {
    FlayFetch.getFlayList().then((list) => {
      this.markerList = list.map((flay) => new FlayMarker(flay, { showTitle: false, shape: this.#opts.shape }));
      this.#start();
    });
  }

  #start() {
    const multifier = getRandomIntInclusive(this.#opts.multifier[0], this.#opts.multifier[0]);
    this.tickTimer.start(getRandomIntInclusive(this.#opts.seconds[0], this.#opts.seconds[1]) * multifier);
    this.dataset.multifier = multifier;
  }

  #togglePause() {
    this.#paused = !this.tickTimer.toggle(); // 일시정지, 재개
    this.classList.toggle('paused', this.#paused);
  }

  async #render() {
    if (this.#n > 0) {
      for (let i = 0; i < this.#threadCount; i++) {
        this.#cancelThread(i);
        delete this.dataset[`intervalT${i}`];
      }
      const consoleTimeName = `disappear-${this.#n}`;
      console.time(consoleTimeName);
      this.tickTimer.pause();
      for (let i = this.#n; i >= 0; ) {
        for (let j = 0; j < this.#threadCount; j++) {
          const marker = this.markerList.find((marker) => marker.dataset.n === String(i));
          if (marker) {
            marker.dataset.n = '';
            marker.classList.remove('highlight', 'active');
          }
          i--;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      this.#n = -1;
      this.tickTimer.resume();
      console.timeEnd(consoleTimeName);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
    }
    this.classList.add('rendering');

    const ORDERs = ['studio', 'opus', 'title', 'actress', 'release', 'random', 'rank', 'shot', 'play', 'modified'];
    this.dataset.order = ORDERs[getRandomInt(0, ORDERs.length)];
    this.markerList.sort((m1, m2) => {
      switch (this.dataset.order) {
        case ORDERs[0]:
          return m2.flay.studio.localeCompare(m1.flay.studio);
        case ORDERs[1]:
          return m2.flay.opus.localeCompare(m1.flay.opus);
        case ORDERs[2]:
          return m2.flay.title.localeCompare(m1.flay.title);
        case ORDERs[3]:
          return m2.flay.actressList.join(',').localeCompare(m1.flay.actressList.join(','));
        case ORDERs[4]:
          return m2.flay.release.localeCompare(m1.flay.release);
        case ORDERs[5]:
          return getRandomIntInclusive(-1, 1);
        case ORDERs[6]:
          return m2.flay.video.rank - m1.flay.video.rank;
        case ORDERs[7]:
          return (m2.flay.video.likes?.length || 0) - (m1.flay.video.likes?.length || 0);
        case ORDERs[8]:
          return m2.flay.video.play - m1.flay.video.play;
        case ORDERs[9]:
          return m2.flay.lastModified - m1.flay.lastModified;
      }
    });

    await document.startViewTransition(() => this.append(...this.markerList)).finished;
    this.#setRelativePositions();

    this.#methodIndex = getRandomInt(0, 3);
    this.#threadCount = getRandomIntInclusive(this.#opts.thread[0], this.#opts.thread[1]);
    this.#timerID = new Array(this.#threadCount);

    this.dataset.method = this.#methodIndex === 0 ? 'near' : this.#methodIndex === 1 ? 'diag' : 'random';
    this.dataset.threads = this.#threadCount;

    const descriptionText = `multifier: ${this.dataset.multifier}, seconds: ${this.tickTimer.seconds}, order: ${this.dataset.order}, threads: ${this.dataset.threads}, method: ${this.dataset.method}`;
    console.log('[render]', descriptionText);

    for (let i = 0; i < this.#threadCount; i++) {
      this.#movingMarker(i);
    }

    this.classList.remove('rendering');
  }

  #setRelativePositions() {
    if (!this.markerList) return;

    [this.#maxX, this.#maxY] = [0, 0];
    const firstMarker = this.markerList[0];
    const firstRect = firstMarker.getBoundingClientRect();
    this.markerList.forEach((marker, index) => {
      if (index === 0) {
        marker.dataset.xy = '0,0';
      } else {
        const rect = marker.getBoundingClientRect();
        const relativeX = (rect.left - firstRect.left) / firstRect.width;
        const relativeY = (rect.top - firstRect.top) / firstRect.height;
        marker.dataset.xy = `${relativeX},${relativeY}`;

        [this.#maxX, this.#maxY] = [Math.max(this.#maxX, relativeX), Math.max(this.#maxY, relativeY)];
      }
    });
  }

  async #movingMarker(threadNo) {
    const INTERVAL = getRandomIntInclusive(this.#opts.interval[0], this.#opts.interval[1]);
    let [dx, dy] = DiagonalDirections[getRandomInt(0, DiagonalDirections.length)]; // 대각선 방향 랜덤으로 결정
    let duplicateHighlightCount = 0; // 하이라이트 중복 개수
    this.dataset[`intervalT${threadNo}`] = INTERVAL;

    /**
     * 마커에 하이라이트 효과를 주는 함수
     * @param {FlayMarker} marker
     */
    const highlightMarker = (marker) => {
      marker.dataset.n = ++this.#n;
      marker.classList.add('highlight');
      marker.animate([{ transform: 'scale(0.8)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1.0)' }], { duration: INTERVAL - this.#opts.interval[0] / 2, easing: 'ease-in-out' });
    };

    /**
     * 현재 marker에서 가까운 마커 구하는 함수
     * @param {number} x
     * @param {number} y
     * @returns
     */
    const getNextNearMarker = (x, y) => {
      const nextDirection = AllDirections.filter(([_x, _y]) => _x !== -dx && _y !== -dy);
      do {
        [dx, dy] = nextDirection.splice(getRandomInt(0, nextDirection.length), 1)[0];
        const nextX = Math.min(Math.max(x + dx, 0), this.#maxX);
        const nextY = Math.min(Math.max(y + dy, 0), this.#maxY);
        const nextMarker = this.markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
        if (nextMarker) {
          if (!nextMarker.classList.contains('highlight')) {
            return nextMarker;
          }
        }
      } while (nextDirection.length > 0);
      // console.debug('[getNextNearMarker] 주변에 갈 곳이 없어 랜덤으로 이동');
      return getNextRandomMarker();
    };

    /**
     * 현재 marker에서 사선 방향으로 이동한 마커 구하는 함수
     * @param {number} x
     * @param {number} y
     * @returns
     */
    const getNextDiagMarker = (x, y) => {
      if (duplicateHighlightCount > 5) {
        console.debug('[getNextDiagMarker] 하이라이트가 연속으로 중복이 5개 이상이라서 랜덤으로 이동');
        duplicateHighlightCount = 0;
        return getNextRandomMarker();
      }

      // Try to continue in the current direction
      let [nextX, nextY] = [x + dx, y + dy];
      let candidate = this.markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
      if (candidate) {
        if (candidate.classList.contains('highlight')) duplicateHighlightCount++;
        else duplicateHighlightCount = 0;
        return candidate;
      }

      // If no candidate in the current direction, try other diagonal directions
      // Exclude the reverse of the current direction.
      const reverse = [-dx, -dy];
      for (const dir of DiagonalDirections) {
        if (dir[0] === reverse[0] && dir[1] === reverse[1]) continue;
        [nextX, nextY] = [x + dir[0], y + dir[1]];
        candidate = this.markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
        if (candidate) {
          // console.debug('방향전환', [dx, dy], '->', dir);
          [dx, dy] = dir;
          if (candidate.classList.contains('highlight')) duplicateHighlightCount++;
          else duplicateHighlightCount = 0;
          return candidate;
        }
      }

      // 바로 옆 주변에 갈수 있는지
      for (const dir of AllDirections) {
        [nextX, nextY] = [x + dir[0], y + dir[1]];
        candidate = this.markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
        if (candidate) {
          // console.debug('대각선으로 이동할 곳이 없어서 옆에 다른 방향으로 이동', dir);
          [dx, dy] = [-dx, -dy]; // 역방향으로 변경
          if (candidate.classList.contains('highlight')) duplicateHighlightCount++;
          else duplicateHighlightCount = 0;
          return candidate;
        }
      }

      // 랜덤으로 선택
      console.log('[getNextDiagMarker] 갈 곳이 없어 랜덤으로 다른 marker에서 다시 출발');
      return getNextRandomMarker();
    };

    const getNextRandomMarker = () => {
      if (this.#isNotExistsHighlight()) {
        console.log('[getNextRandomMarker] 모든 marker가 highlight되어 있음. stop');
        return null;
      }
      const notHighlight = this.markerList.filter((marker) => !marker.classList.contains('highlight'));
      return notHighlight[getRandomInt(0, notHighlight.length)];
    };

    const getNextMarker = (() => {
      switch (this.#methodIndex) {
        case 0:
          return getNextNearMarker;
        case 1:
          return getNextDiagMarker;
        case 2:
          return getNextRandomMarker;
      }
    })();

    const startMarker = this.markerList[getRandomInt(0, this.markerList.length)];
    let [x, y] = startMarker.dataset.xy.split(',').map(Number);
    highlightMarker(startMarker);

    this.#timerID[threadNo] = setInterval(() => {
      if (this.#paused) return;
      if (this.#isNotExistsHighlight()) {
        this.#cancelThread(threadNo);
        return;
      }

      const marker = getNextMarker(x, y);
      if (marker) {
        [x, y] = marker.dataset.xy.split(',').map(Number);
        highlightMarker(marker);
      }
    }, INTERVAL);
    console.log(`Thread ${threadNo} started`, 'timerID:', this.#timerID[threadNo], 'interval:', INTERVAL);
  }

  /**
   * 스레드 취소
   * @param {number} threadNo
   */
  #cancelThread(threadNo) {
    if (this.#timerID[threadNo] === undefined) return;
    clearInterval(this.#timerID[threadNo]);
    console.log(`Thread ${threadNo} cancelled`, this.#timerID[threadNo]);
  }

  /**
   * 하이라이트가 없는 마커가 모두 사라졌는지 여부
   * @returns {boolean}
   */
  #isNotExistsHighlight() {
    return this.markerList.every((marker) => !marker.classList.contains('highlight'));
  }
}

customElements.define('flay-marker-panel', FlayMarkerPanel, { extends: 'div' });
