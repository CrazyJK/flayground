import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import { addResizeListener } from '@lib/windowAddEventListener';
import { EVENT_TIMER_END, EVENT_TIMER_START, EVENT_TIMER_TICK, TickTimer } from '@ui/TickTimer';
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
const DEFAULT_OPTIONS: PanelOptions = {
  /** 시간 배수 */ multifier: [1, 3],
  /** 타이머 시간. s */ seconds: [50, 70],
  /** 스레드 개수 */ thread: [1, 3],
  /** 나타나는 시간 간격. ms */ interval: [200, 500],
  /** 모양. square, circle, star, heart */ shape: 'star',
  /** marker 크기. 1부터 0.5step */ size: 1,
};

interface PanelOptions {
  multifier: [number, number];
  seconds: [number, number];
  thread: [number, number];
  interval: [number, number];
  shape: 'square' | 'circle' | 'star' | 'heart';
  size: number;
}

export class FlayMarkerPanel extends HTMLElement {
  #markerList = []; // 마커 리스트
  #threadCount = 1; // 스레드 개수
  #paused = false; // 일시정지 여부
  #lastNo = -1; // 하이라이트 마커 마지막 번호
  #opts: PanelOptions; // 옵션
  #highlightedCount = 0; // 하이라이트된 마커 수 (성능 최적화용)
  #animationFrames = []; // requestAnimationFrame 식별자 배열
  #threadIntervals = []; // 각 스레드별 인터벌 값
  #lastFrameTime = []; // 각 스레드별 마지막 프레임 시간
  tickTimer = null; // 타이머 인스턴스

  /**
   *
   * @param {DEFAULT_OPTIONS} options 배열은 항목의 [min, max] 값
   */
  constructor(options: Partial<PanelOptions>) {
    super();

    this.#opts = { ...DEFAULT_OPTIONS, ...options };
    this.dataset.w = String(this.#opts.size);

    this.tickTimer = new TickTimer();
    this.tickTimer.addEventListener(EVENT_TIMER_START, () => this.#render());
    this.tickTimer.addEventListener(EVENT_TIMER_END, () => this.#start());
    this.tickTimer.addEventListener(EVENT_TIMER_TICK, (e) => (this.dataset.seconds = e.detail.seconds));

    addResizeListener(() => this.#updateMarkerPositions(), true);

    this.addEventListener('click', (e) => {
      if (e.target === this) this.#togglePause();
    });
    this.addEventListener('wheel', (e) => {
      this.#togglePause();
      this.dataset.w = String((this.#opts.size = e.deltaY < 0 ? Math.min(this.#opts.size + 0.5, 20) : Math.max(this.#opts.size - 0.5, 1)));
      this.#updateMarkerPositions();
      this.#togglePause();
    });
    this.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  connectedCallback() {
    FlayFetch.getFlayList().then((list) => {
      this.#markerList = list.map((flay) => new FlayMarker(flay, { tooltip: false, shape: this.#opts.shape }));
      this.#start();
    });
  }

  /**
   * 타이머가 종료되면 호출되서, 다시 시작
   */
  #start() {
    const multifier = RandomUtils.getRandomIntInclusive(...this.#opts.multifier);
    this.tickTimer.start(RandomUtils.getRandomIntInclusive(...this.#opts.seconds) * multifier);
    this.dataset.multifier = String(multifier);
  }

  /**
   * 일시정지, 재개
   */
  #togglePause() {
    this.#paused = !this.tickTimer.toggle(); // 일시정지, 재개
    this.classList.toggle('paused', this.#paused);
  }

  /**
   * 마커의 좌표 설정
   * @returns
   */
  #updateMarkerPositions() {
    if (this.#markerList.length === 0) return;

    const firstMarker = this.#markerList[0];
    const firstRect = firstMarker.getBoundingClientRect();
    this.#markerList.forEach((marker, index) => {
      if (index === 0) {
        marker.dataset.xy = '0,0';
      } else {
        const rect = marker.getBoundingClientRect();
        const relativeX = (rect.left - firstRect.left) / firstRect.width;
        const relativeY = (rect.top - firstRect.top) / firstRect.height;
        marker.dataset.xy = `${relativeX},${relativeY}`;
      }
    });

    const xy = this.#markerList.map((marker) => marker.dataset.xy.split(',').map(Number));
    const maxX = Math.max(...xy.map(([_x, _y]) => _x));
    const maxY = Math.max(...xy.map(([_x, _y]) => _y));
    console.log('[updateMarkerPositions] maxX:', maxX, 'maxY:', maxY);
  }

  /**
   * 타이머가 사적되면 호출되서, 마커를 렌더링
   */
  async #render() {
    if (this.#lastNo > 0) {
      await this.#reset();
    }
    this.classList.add('rendering');

    // 정렬 방식을 랜덤으로 정렬
    const ORDERs = ['studio', 'opus', 'title', 'actress', 'release', 'random', 'rank', 'shot', 'play', 'modified'];
    this.dataset.order = ORDERs[RandomUtils.getRandomInt(0, ORDERs.length)];
    this.#markerList.sort((m1, m2) => {
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
          return RandomUtils.getRandomIntInclusive(-1, 1);
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

    // 다시 정렬된 마커를 화면에 적용
    await document.startViewTransition(() => this.append(...this.#markerList)).finished;
    // 마커의 좌표 설정
    this.#updateMarkerPositions();

    // 스레드 개수 랜덤으로 설정
    this.#threadCount = RandomUtils.getRandomIntInclusive(...this.#opts.thread);
    this.dataset.threads = String(this.#threadCount);

    const descriptionText = `multifier: ${this.dataset.multifier}, seconds: ${this.tickTimer.seconds}, order: ${this.dataset.order}, threads: ${this.dataset.threads}`;
    console.log('[render]', descriptionText);

    // 스레드 개수만큼 마커 이동
    for (let i = 0; i < this.#threadCount; i++) {
      this.#movingMarker(i);
    }

    this.classList.remove('rendering');
  }

  /**
   * 초기화
   *
   * 스레드 취소, 타이머 일시정지, 모든 하이라이트 마커 사라질 때까지 대기
   */
  async #reset() {
    this.#cancelAllThread();
    this.#highlightedCount = 0; // 하이라이트된 마커 수 재설정

    await new Promise((resolve) => setTimeout(resolve, 3000)); // 3초 대기

    const consoleTimeName = `disappear-${this.#lastNo}-${Date.now()}`;
    console.time(consoleTimeName);
    this.tickTimer.pause();

    // 하이라이트된 마커만 미리 찾아두기
    const highlightedMarkers = this.#markerList.filter((marker) => marker.classList.contains('highlight'));
    const batchSize = Math.ceil(highlightedMarkers.length / this.#threadCount);

    for (let i = 0; i < highlightedMarkers.length; i += batchSize) {
      const batch = highlightedMarkers.slice(i, i + batchSize);

      batch.forEach((marker) => {
        marker.dataset.n = '';
        marker.classList.remove('highlight', 'active');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    console.log('[reset] All markers disappeared.');
    this.#lastNo = -1;
    this.tickTimer.resume();
    console.timeEnd(consoleTimeName);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
  }

  /**
   * 마커 이동
   * @param {number} threadNo 스레드 번호
   */
  async #movingMarker(threadNo) {
    /**
     * 마커에 하이라이트 효과를 주는 함수
     * @param {FlayMarker} marker
     */
    const highlightMarker = (marker) => {
      if (!marker.classList.contains('highlight')) {
        marker.dataset.n = ++this.#lastNo;
        marker.classList.add('highlight');
        this.#highlightedCount++; // 하이라이트된 마커 수 증가
        marker.animate([{ transform: 'scale(0.8)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1.0)' }], { duration: INTERVAL - this.#opts.interval[0] / 2, easing: 'ease-in-out' });
      }
    };

    /**
     * 모든 마커가 하이라이트되었는지 여부
     * @returns {boolean}
     */
    const isAllMarkerHighlighted = () => this.#highlightedCount >= this.#markerList.length;

    /**
     * 현재 marker에서 주변으로 퍼져나가는 마커 구하는 함수
     * @param {number} x 현재 x 좌표
     * @param {number} y 현재 y 좌표
     * @returns {FlayMarker?}
     */
    const findNextSpreadMarker = (x, y) => {
      const nextDirection = AllDirections.filter(([_x, _y]) => _x !== -dx && _y !== -dy); // 현재 방향을 제외한 방향
      do {
        [dx, dy] = nextDirection.splice(RandomUtils.getRandomInt(0, nextDirection.length), 1)[0]; // 랜덤으로 방향 선택
        const [nextX, nextY] = [x + dx, y + dy];
        const nextMarker = this.#markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
        if (nextMarker) {
          if (!nextMarker.classList.contains('highlight')) {
            return nextMarker;
          }
        }
      } while (nextDirection.length > 0);

      if (duplicatedCount > 5) {
        duplicatedCount = 0;
        console.debug(`Thread ${threadNo} [findNextSpreadMarker] 하이라이트가 연속으로 중복이 5개 이상이라서 랜덤으로 이동`);
        return findNextRandomMarker();
      } else {
        ++duplicatedCount;
        return findNextSpreadMarker(x + dx, y + dy);
      }
    };

    /**
     * 현재 marker에서 사선 방향으로 이동한 마커 구하는 함수
     * @param {number} x 현재 x 좌표
     * @param {number} y 현재 y 좌표
     * @returns {FlayMarker?}
     */
    const findNextDiagonalMarker = (x, y) => {
      if (duplicatedCount > 5) {
        console.debug(`Thread ${threadNo} [findNextDiagonalMarker] 하이라이트가 연속으로 중복이 5개 이상이라서 랜덤으로 이동`);
        duplicatedCount = 0;
        return findNextRandomMarker();
      }

      // Try to continue in the current direction
      let [nextX, nextY] = [x + dx, y + dy];
      let candidate = this.#markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
      if (candidate) {
        if (candidate.classList.contains('highlight')) duplicatedCount++;
        else duplicatedCount = 0;
        return candidate;
      }

      // If no candidate in the current direction, try other diagonal directions
      // Exclude the reverse of the current direction.
      const reverse = [-dx, -dy];
      for (const dir of DiagonalDirections) {
        if (dir[0] === reverse[0] && dir[1] === reverse[1]) continue;
        [nextX, nextY] = [x + dir[0], y + dir[1]];
        candidate = this.#markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
        if (candidate) {
          [dx, dy] = dir; // 전환한 방향으로 변경
          if (candidate.classList.contains('highlight')) duplicatedCount++;
          else duplicatedCount = 0;
          console.debug(`Thread ${threadNo} [findNextDiagonalMarker] 방향 전환해서 이동`, dir);
          return candidate;
        }
      }

      // 바로 옆 주변에 갈수 있는지
      for (const dir of AllDirections) {
        [nextX, nextY] = [x + dir[0], y + dir[1]];
        candidate = this.#markerList.find((marker) => marker.dataset.xy === `${nextX},${nextY}`);
        if (candidate) {
          [dx, dy] = [-dx, -dy]; // 역방향으로 변경
          if (candidate.classList.contains('highlight')) duplicatedCount++;
          else duplicatedCount = 0;
          console.debug(`Thread ${threadNo} [findNextDiagonalMarker] 대각선으로 이동할 곳이 없어서 옆에 다른 방향으로 이동`, dir);
          return candidate;
        }
      }

      // 랜덤으로 선택
      console.debug(`Thread ${threadNo} [findNextDiagonalMarker] 갈 곳이 없어 랜덤으로 다른 marker에서 다시 출발`);
      return findNextRandomMarker();
    };

    /**
     * 현재 marker에서 랜덤으로 이동한 마커 구하는 함수
     * @returns {FlayMarker?}
     */
    const findNextRandomMarker = () => {
      if (isAllMarkerHighlighted()) {
        console.debug(`Thread ${threadNo} [findNextRandomMarker] 모든 marker가 highlight되어 있음`);
        return null;
      }
      const notHighlight = this.#markerList.filter((marker) => !marker.classList.contains('highlight'));
      return notHighlight[RandomUtils.getRandomInt(0, notHighlight.length)];
    };

    const INTERVAL = RandomUtils.getRandomIntInclusive(...this.#opts.interval);
    this.dataset[`t${threadNo}Interval`] = String(INTERVAL);
    this.#threadIntervals[threadNo] = INTERVAL;
    this.#lastFrameTime[threadNo] = performance.now();

    let [dx, dy] = DiagonalDirections[RandomUtils.getRandomInt(0, DiagonalDirections.length)]; // 대각선 방향 랜덤으로 결정
    let duplicatedCount = 0; // 중복 개수

    const findNextMarker = (() => {
      switch (RandomUtils.getRandomInt(0, 3)) {
        case 0:
          this.dataset[`t${threadNo}Method`] = 'spread';
          return findNextSpreadMarker;
        case 1:
          this.dataset[`t${threadNo}Method`] = 'diagonal';
          return findNextDiagonalMarker;
        case 2:
          this.dataset[`t${threadNo}Method`] = 'random';
          return findNextRandomMarker;
      }
    })();

    let marker = findNextRandomMarker();
    let [x, y] = marker.dataset.xy.split(',').map(Number);
    highlightMarker(marker);

    // requestAnimationFrame을 사용한 타이머 대체
    const animate = (timestamp) => {
      if (this.#paused) {
        this.#animationFrames[threadNo] = requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - this.#lastFrameTime[threadNo];

      if (elapsed >= INTERVAL) {
        this.#lastFrameTime[threadNo] = timestamp;

        marker = findNextMarker(x, y);
        if (marker) {
          [x, y] = marker.dataset.xy.split(',').map(Number);
          highlightMarker(marker);
        }

        if (isAllMarkerHighlighted()) {
          this.#cancelThread(threadNo);
          return;
        }
      }

      this.#animationFrames[threadNo] = requestAnimationFrame(animate);
    };

    this.#animationFrames[threadNo] = requestAnimationFrame(animate);
    console.log(`Thread ${threadNo} started.`, 'animationFrame:', this.#animationFrames[threadNo], 'interval:', INTERVAL, 'method:', this.dataset[`t${threadNo}Method`]);
  }

  /**
   * 스레드 취소
   * @param {number} threadNo
   */
  #cancelThread(threadNo) {
    if (this.#animationFrames[threadNo] === undefined) return;

    cancelAnimationFrame(this.#animationFrames[threadNo]);
    console.log(`Thread ${threadNo} cancelled`, this.#animationFrames[threadNo]);

    this.#animationFrames[threadNo] = undefined;
    if (this.#animationFrames.every((id) => id === undefined)) {
      console.log(`All ${this.#animationFrames.length} threads are cancelled and the timer is stopped.`);
      this.tickTimer.stop();
    }
  }

  #cancelAllThread() {
    for (let i = 0; i < this.#threadCount; i++) {
      if (this.#animationFrames[i] !== undefined) {
        cancelAnimationFrame(this.#animationFrames[i]);
        this.#animationFrames[i] = undefined;
      }
      delete this.dataset[`t${i}Interval`];
      delete this.dataset[`t${i}Method`];
    }
    console.log(`All threads are cancelled and the timer is stopped.`);
  }
}

customElements.define('flay-marker-panel', FlayMarkerPanel);
