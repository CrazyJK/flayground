import FlayFetch from '../../lib/FlayFetch';
import { getRandomInt, getRandomIntInclusive } from '../../lib/randomNumber';
import { addResizeListener } from '../../lib/windowAddEventListener';
import { EVENT_TIMER_END, EVENT_TIMER_START, EVENT_TIMER_TICK, TickTimer } from '../../ui/TickTimer';
import FlayMarker from '../domain/FlayMarker';
import './FlayMarkerPanel.scss';

export class FlayMarkerPanel extends HTMLDivElement {
  #timerID = 0;
  #maxX = 0;
  #maxY = 0;
  #n = -1;
  #paused = false;

  constructor() {
    super();
    this.classList.add('flay-marker-panel');

    this.tickTimer = new TickTimer();
    this.tickTimer.addEventListener(EVENT_TIMER_START, () => this.#render());
    this.tickTimer.addEventListener(EVENT_TIMER_END, () => this.#start());
    this.tickTimer.addEventListener(EVENT_TIMER_TICK, (e) => (this.dataset.seconds = e.detail.seconds));

    addResizeListener(() => this.#setRelativePositions());

    this.addEventListener('click', (e) => {
      if (e.target === this) this.#togglePause();
    });
  }

  connectedCallback() {
    FlayFetch.getFlayList().then((list) => {
      this.markerList = list.map((flay) => new FlayMarker(flay, { showTitle: false }));
      this.#start();
    });
  }

  #start() {
    this.tickTimer.start(getRandomIntInclusive(50, 70) * 2);
  }

  #togglePause() {
    this.#paused = !this.tickTimer.toggle(); // 일시정지, 재개
    this.classList.toggle('paused', this.#paused);
  }

  async #render() {
    clearInterval(this.#timerID);
    this.tickTimer.pause();
    for (let i = this.#n; i >= 0; i--) {
      const marker = this.markerList.find((marker) => marker.dataset.n === String(i));
      if (marker) {
        marker.dataset.n = '';
        marker.classList.remove('highlight', 'active');
        await new Promise((resolve) => setTimeout(resolve, i / 2)); // 점검 빨리 사라지도록
      }
    }
    this.#n = -1;
    this.tickTimer.resume();
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
    this.#movingMarker();
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

  #movingMarker() {
    const INTERVAL = 700;
    const DIRECTIONs = [
      /** up */ [0, -1],
      /** down */ [0, 1],
      /** left */ [-1, 0],
      /** right */ [1, 0],
      /** up-left */ [-1, -1],
      /** up-right */ [1, -1],
      /** down-left */ [-1, 1],
      /** down-right */ [1, 1],
    ]; // 8방향
    const DiagDirections = DIRECTIONs.filter((d) => d[0] !== 0 && d[1] !== 0); // 대각선 방향만
    let currentDiagDirection = DiagDirections[getRandomInt(0, DiagDirections.length)]; // 대각선 방향 랜덤으로 결정

    /**
     * 마커에 하이라이트 효과를 주는 함수
     * @param {FlayMarker} marker
     */
    const highlightMarker = (marker) => {
      marker.dataset.n = ++this.#n;
      marker.classList.add('highlight');
      marker.animate([{ transform: 'scale(1.0)' }, { transform: 'scale(1.2)' }], { duration: INTERVAL });
    };

    /**
     * 현재 marker에서 가까운 마커 구하는 함수
     * @param {number} x
     * @param {number} y
     * @returns
     */
    const getNextNearMarker = (x, y) => {
      const [dx, dy] = DIRECTIONs[getRandomInt(0, DIRECTIONs.length)];
      const nextX = Math.min(Math.max(x + dx, 0), this.#maxX);
      const nextY = Math.min(Math.max(y + dy, 0), this.#maxY);
      const nextMarker = this.markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
      if (!nextMarker || nextMarker.classList.contains('highlight')) {
        return getNextNearMarker(nextX, nextY);
      } else {
        return nextMarker;
      }
    };

    /**
     * 현재 marker에서 사선 방향으로 이동한 마커 구하는 함수
     * @param {number} x
     * @param {number} y
     * @returns
     */
    const getNextDiagMarker = (x, y) => {
      // Try to continue in the current direction
      let nextX = x + currentDiagDirection[0];
      let nextY = y + currentDiagDirection[1];
      let candidate = this.markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
      if (candidate) {
        if (candidate.classList.contains('highlight')) {
          console.debug('갈 곳이 이미 highlight되어 있음. 건너뛰기', candidate.dataset.xy.split(',').map(Number));
          return getNextDiagMarker(nextX, nextY); // Try again in the same direction
        }
        return candidate;
      }

      // If no candidate in the current direction, try other diagonal directions
      // Exclude the reverse of the current direction.
      const reverse = [-currentDiagDirection[0], -currentDiagDirection[1]];
      for (const dir of DiagDirections) {
        if (dir[0] === reverse[0] && dir[1] === reverse[1]) continue;
        nextX = x + dir[0];
        nextY = y + dir[1];
        candidate = this.markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
        if (candidate) {
          console.debug('방향전환', currentDiagDirection, '->', dir);
          currentDiagDirection = dir;
          return candidate;
        }
      }
      // Fallback: Return candidate in current direction even if highlighted (should rarely happen)
      candidate = this.markerList[getRandomInt(0, this.markerList.length)]; // Pick a random marker
      console.log('갈 곳이 없어 다른 marker에서 다시 출발', candidate.dataset.xy.split(',').map(Number));
      return candidate;
    };

    const getNextMarker = getRandomIntInclusive(0, 1) ? getNextNearMarker : getNextDiagMarker;

    const startMarker = this.markerList[getRandomInt(0, this.markerList.length)];
    let [x, y] = startMarker.dataset.xy.split(',').map(Number);
    highlightMarker(startMarker);

    this.#timerID = setInterval(() => {
      if (this.#paused) return;

      const marker = getNextMarker(x, y);
      [x, y] = marker.dataset.xy.split(',').map(Number);
      highlightMarker(marker);
    }, INTERVAL);
  }
}

customElements.define('flay-marker-panel', FlayMarkerPanel, { extends: 'div' });
