import FlayFetch from '@lib/FlayFetch';
import { addResizeListener } from '@lib/windowAddEventListener';

/**
 * @file FlayMarkerSky.js
 * @description 밤하늘의 별(FlayMarker)을 표현하는 커스텀 엘리먼트입니다.
 * 화면 크기에 맞게 동적으로 별의 개수를 조절하며, 지속적으로 새로운 별을 생성하고,
 * 공간이 부족할 경우 가장 오래된 별을 제거합니다.
 * 클릭을 통해 별 생성을 일시정지/재개할 수 있습니다.
 */

/**
 * @class FlayMarkerSky
 * @extends HTMLElement
 * @description 밤하늘의 별(FlayMarker)을 표현하는 커스텀 엘리먼트.
 * 화면 크기에 맞게 동적으로 별의 개수를 조절하며 배치합니다.
 */
export class FlayMarkerSky extends HTMLElement {
  /** @private @type {object} 리사이즈 상태 정보 */
  #resizeState = { originalWidth: window.innerWidth, originalHeight: window.innerHeight, markerPositions: new Map() };
  /** @private @type {Array<object>} 현재 화면에 표시된 마커들의 정보 배열 */
  #existingMarkers = [];
  /** @private @type {boolean} 데이터 로딩 중 여부 */
  #isLoading = false;
  /** @private @type {boolean} 마커 생성 일시정지 상태 여부 */
  #isPaused = false;
  /** @private @type {Array<HTMLElement>} 생성된 마커 DOM 엘리먼트들을 순서대로 저장하는 큐 */
  #markerQueue = [];
  /** @private @type {number|null} 마커 생성 인터벌 ID */
  #markerGeneratorInterval = null;
  /** @private @type {Array<object>} 서버에서 가져온 모든 Flay 데이터 캐시 */
  #allFlayData = [];
  /** @private @type {Function} this가 바인딩된 #togglePause 메서드 */
  boundTogglePause = this.#togglePause.bind(this);

  constructor() {
    super();
  }

  connectedCallback() {
    Object.assign(this.style, { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' });

    // 초기 화면 크기 저장
    this.#resizeState.originalWidth = this.offsetWidth;
    this.#resizeState.originalHeight = this.offsetHeight;

    // 리사이즈 이벤트 처리
    this.#setupResizeHandler();

    // 별(마커) 로드 및 표시
    this.#loadAndStartContinuousGeneration();

    // 클릭 이벤트 리스너 추가 (일시정지/재개)
    this.addEventListener('click', this.boundTogglePause);
  }

  disconnectedCallback() {
    this.#existingMarkers = [];
    this.#resizeState.markerPositions.clear();
    this.#markerQueue = [];
    if (this.#markerGeneratorInterval) clearInterval(this.#markerGeneratorInterval);
    this.removeEventListener('click', this.boundTogglePause);
  }

  /**
   * @private
   * @description 마커 생성 및 표시를 일시정지하거나 재개합니다.
   * @param {MouseEvent} event - 클릭 이벤트 객체
   */
  #togglePause(event) {
    // 마커 자체를 클릭한 경우는 무시
    if (event.target !== this) {
      return;
    }
    this.#isPaused = !this.#isPaused;
  }

  /**
   * @private
   * @async
   * @description 초기 마커를 로드하고, 이후 지속적으로 마커를 생성하기 시작합니다.
   * 모든 Flay 데이터를 가져와 캐시하고, 초기 마커들을 화면에 배치한 후,
   * 일정 간격으로 새 마커를 추가하는 인터벌을 설정합니다.
   */
  async #loadAndStartContinuousGeneration() {
    if (this.#isLoading) return;
    this.#isLoading = true;
    try {
      this.#allFlayData = await FlayFetch.getFlayAll();
      if (!this.#allFlayData?.length) return;
      const { default: FlayMarker } = await import('@flay/domain/FlayMarker');
      for (let i = 0, n = Math.min(this.#calculateInitialMarkerCount(), this.#allFlayData.length); i < n; i++) {
        if (!this.#allFlayData.length) break;
        await this.#addSingleMarker(this.#allFlayData[Math.floor(Math.random() * this.#allFlayData.length)], FlayMarker);
        await new Promise((r) => setTimeout(r, Math.random() * 200 + 50));
      }
      if (this.#markerGeneratorInterval) clearInterval(this.#markerGeneratorInterval);
      this.#markerGeneratorInterval = setInterval(
        async () => {
          if (!this.#isPaused && this.#allFlayData.length > 0) {
            await this.#addSingleMarker(this.#allFlayData[Math.floor(Math.random() * this.#allFlayData.length)], FlayMarker);
          }
        },
        Math.random() * 500 + 300
      );
    } catch (e) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = '별(FlayMarker) 데이터를 불러오는 중 문제가 발생했습니다';
      Object.assign(errorMsg.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(220,53,69,0.9)',
        color: 'white',
        padding: '1rem 2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: '1000',
      });
      this.appendChild(errorMsg);
    } finally {
      this.#isLoading = false;
    }
  }

  /**
   * @private
   * @async
   * @description 단일 FlayMarker를 생성하고 화면에 추가합니다.
   * 사용 가능한 공간이 없으면 가장 오래된 마커를 제거하고 다시 시도합니다.
   * @param {object} flayData - 마커를 생성할 Flay 데이터 객체.
   * @param {typeof HTMLElement} FlayMarkerComponent - FlayMarker 커스텀 엘리먼트 클래스.
   * @returns {Promise<HTMLElement|null>} 추가된 마커 엘리먼트 또는 실패 시 null.
   */
  async #addSingleMarker(flayData, FlayMarkerComponent) {
    if (!flayData) {
      if (this.#allFlayData.length > 0) flayData = this.#allFlayData[Math.floor(Math.random() * this.#allFlayData.length)];
      else {
        if (this.#markerGeneratorInterval) clearInterval(this.#markerGeneratorInterval);
        return null;
      }
    }
    let FlayMarker = FlayMarkerComponent;
    if (!FlayMarker) ({ default: FlayMarker } = await import('@flay/domain/FlayMarker'));
    const marker = new FlayMarker(flayData, { showTitle: false, shape: 'star' });
    if (flayData.opus) marker.dataset.opus = flayData.opus;
    const positionInfo = this.#getRandomPosition(marker);
    if (positionInfo) {
      this.appendChild(this.#locateFlayMarker(marker, false, positionInfo));
      this.#markerQueue.push(marker);
      // 실제로 추가된 경우에만 데이터 소진
      if (flayData.opus) {
        const idx = this.#allFlayData.findIndex((d) => d.opus === flayData.opus);
        if (idx > -1) this.#allFlayData.splice(idx, 1);
      }
      return marker;
    } else if (this.#markerQueue.length > 0) {
      const oldestMarker = this.#markerQueue.shift();
      const idx = this.#existingMarkers.findIndex((m) => m.element === oldestMarker);
      if (idx > -1) this.#existingMarkers.splice(idx, 1);
      this.#resizeState.markerPositions.delete(oldestMarker);
      oldestMarker.remove();
      const newPositionInfo = this.#getRandomPosition(marker);
      if (newPositionInfo) {
        this.appendChild(this.#locateFlayMarker(marker, false, newPositionInfo));
        this.#markerQueue.push(marker);
        if (flayData.opus) {
          const idx2 = this.#allFlayData.findIndex((d) => d.opus === flayData.opus);
          if (idx2 > -1) this.#allFlayData.splice(idx2, 1);
        }
        return marker;
      }
    }
    return null;
  }

  /**
   * @private
   * @description 창 크기 변경 이벤트를 감지하고 처리하는 핸들러를 설정합니다.
   * 디바운싱을 적용하여 성능을 최적화하고, 화면 크기가 크게 변경될 경우
   * 마커 위치를 재조정합니다.
   */
  #setupResizeHandler() {
    const debounce = (f, d) => {
      let t;
      return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => f.apply(this, a), d);
      };
    };
    addResizeListener(
      debounce(() => {
        const oldW = this.#resizeState.originalWidth,
          oldH = this.#resizeState.originalHeight;
        const newW = this.offsetWidth, // 변경
          newH = this.offsetHeight; // 변경
        const areaRatio = (newW / oldW) * (newH / oldH);
        if (areaRatio > 1.2 || areaRatio < 0.8 || oldW !== newW || oldH !== newH) {
          // 크기 변경 감지 조건 강화
          this.#resizeState.originalWidth = newW;
          this.#resizeState.originalHeight = newH;
        }
        requestAnimationFrame(() => {
          this.querySelectorAll('.flay-marker').forEach((marker) => this.#locateFlayMarker(marker, true));
        });
      }, 250),
      true
    );
  }

  /**
   * @private
   * @description 현재 화면 크기에 맞는 초기 마커 개수를 계산합니다.
   * @returns {number} 계산된 초기 마커 개수.
   */
  #calculateInitialMarkerCount() {
    const area = this.offsetWidth * this.offsetHeight; // 변경
    const base = 1920 * 1080; // 기준 해상도 (예시)
    return Math.max(10, Math.floor(20 * Math.max(0.5, Math.min(2, area / base))));
  }

  /**
   * @private
   * @description 지정된 위치 (x, y)에 특정 너비(width)의 마커를 배치할 때
   * 기존 마커들과 겹치는지 확인합니다.
   * 절반 이상 겹칠 때만 겹침으로 간주합니다.
   */
  #isOverlapping(x, y, width, markerElement) {
    return this.#existingMarkers.some((marker) => {
      if (marker.element === markerElement) return false;
      const ex = marker.x,
        ey = marker.y,
        ew = marker.width;
      const overlapX = Math.max(0, Math.min(x + width, ex + ew) - Math.max(x, ex));
      const overlapY = Math.max(0, Math.min(y + width, ey + ew) - Math.max(y, ey));
      return overlapX * overlapY > (width * width) / 2;
    });
  }

  /**
   * @private
   * @description 화면 내에서 다른 마커와 겹치지 않는 랜덤 위치를 계산하여 반환합니다.
   * @param {HTMLElement} markerElement - 위치를 찾을 마커 엘리먼트.
   * @returns {{x: number, y: number, randomWidth: number}|null} 겹치지 않는 위치 정보 객체 또는 null (공간을 찾지 못한 경우).
   */
  #getRandomPosition(markerElement) {
    const [min, max] = [20, 50],
      maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
      const w = Math.floor(Math.random() * (max - min)) + min;
      const x = Math.floor(Math.random() * (this.offsetWidth - w)); // 변경
      const y = Math.floor(Math.random() * (this.offsetHeight - w)); // 변경
      if (!this.#isOverlapping(x, y, w, markerElement)) return { x, y, randomWidth: w };
    }
    return null;
  }

  /**
   * @private
   * @description FlayMarker를 지정된 위치에 배치하거나, 리사이즈 시 위치를 조정합니다.
   * 새로운 마커인 경우 등장 애니메이션을 적용하고, 리사이즈 시에는 크기 조정 애니메이션을 적용합니다.
   * @param {HTMLElement} flayMarker - 배치할 FlayMarker 엘리먼트.
   * @param {boolean} [isResize=false] - 리사이즈로 인한 위치 조정인지 여부.
   * @param {{x: number, y: number, randomWidth: number}|null} [positionInfo=null] - 새로 배치할 마커의 위치 정보. isResize가 false일 때 필요.
   * @returns {HTMLElement} 배치된 FlayMarker 엘리먼트.
   */
  #locateFlayMarker(flayMarker, isResize = false, positionInfo = null) {
    if (isResize && this.#resizeState.markerPositions.has(flayMarker)) {
      const info = this.#resizeState.markerPositions.get(flayMarker);
      const widthRatio = this.offsetWidth / this.#resizeState.originalWidth; // 변경
      const heightRatio = this.offsetHeight / this.#resizeState.originalHeight; // 변경
      const newX = Math.round(info.x * widthRatio);
      const newY = Math.round(info.y * heightRatio);
      const width = parseInt(flayMarker.style.width);
      // 마커가 컴포넌트 경계 내에 있도록 보정
      const safeX = Math.min(Math.max(0, newX), this.offsetWidth - width); // 변경 (경계값 및 width 고려)
      const safeY = Math.min(Math.max(0, newY), this.offsetHeight - width); // 변경 (경계값 및 width 고려)
      flayMarker.style.left = `${safeX}px`;
      flayMarker.style.top = `${safeY}px`;
      // 스케일 애니메이션 비율 조정 (컴포넌트 크기 변경에 더 민감하게 반응하도록)
      const scaleChange = Math.sqrt(widthRatio * heightRatio);
      flayMarker.animate([{ transform: `scale(${1 / Math.max(0.5, Math.min(1.5, scaleChange))})` }, { transform: `scale(${Math.max(0.5, Math.min(1.5, scaleChange))})` }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
      return flayMarker;
    }
    if (positionInfo) {
      const { x, y, randomWidth } = positionInfo;
      Object.assign(flayMarker.style, { position: 'absolute', left: `${x}px`, top: `${y}px`, width: `${randomWidth}px` });
      this.#existingMarkers.push({ x, y, width: randomWidth, element: flayMarker });
      this.#resizeState.markerPositions.set(flayMarker, { x, y, width: randomWidth });
      flayMarker.animate(
        [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.2)', opacity: 0.8, offset: 0.7 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration: 800, easing: 'cubic-bezier(0.175,0.885,0.32,1.275)' }
      );
      setTimeout(() => {
        flayMarker.animate(
          [
            { opacity: 1, filter: 'brightness(1)' },
            { opacity: 1, filter: 'brightness(1.5)', offset: 0.5 },
            { opacity: 1, filter: 'brightness(1)' },
          ],
          { duration: 1500, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
        );
      }, 800);
      return flayMarker;
    }
    return flayMarker;
  }
}

// 커스텀 엘리먼트 등록
customElements.define('flay-marker-sky', FlayMarkerSky);
