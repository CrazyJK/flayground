/**
 * 이미지 원형 표시 컴포넌트
 *
 * @version 2.1.0
 */
import FlayFetch from '@lib/FlayFetch';
import './imageCircle.scss';

// 상수들을 명확한 구조로 그룹화
const CSS_CLASSES = {
  base: ['image-circle', 'flay-div'],
  shapes: { circle: 'circle', square: 'square', rounded: 'rounded' },
  effects: { emboss: 'emboss', engrave: 'engrave' },
};

const ANIMATION = {
  keyframes: [{ transform: 'scale(0.1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
  options: { easing: 'ease-in-out' },
};

const TIMING = {
  minDelay: 5000, // 최소 지연 시간 (ms)
  delayMultiplier: 1000, // 지연 시간 배수
  errorRetryDelay: 100, // 오류 시 재시도 지연 시간 (ms)
  resumeMinDelay: 100, // 애니메이션 재개 최소 지연 시간 (ms)
};

const CACHE = {
  maxPreloadedImages: 3, // 최대 프리로드 이미지 수
};

const DEFAULT_OPTIONS = {
  rem: 10,
  shape: CSS_CLASSES.shapes.circle,
  effect: CSS_CLASSES.effects.emboss,
  duration: 2000,
  eventAllow: false,
};

/**
 * 이미지 원형 표시 웹 컴포넌트
 * - 설정 가능한 모양과 효과를 가진 순환 이미지 표시
 * - 성능 최적화된 프리로딩 및 캐싱 기능
 * - 마우스 인터랙션 지원 (일시정지/재개)
 *
 * @class ImageCircle
 * @extends {HTMLDivElement}
 */
export class ImageCircle extends HTMLDivElement {
  /** @private 옵션 설정 */
  #opts = DEFAULT_OPTIONS;
  /** @private 컴포넌트 활성 상태 */
  #isActive = false;
  /** @private 타이머 ID */
  #timeoutId = null;
  /** @private 현재 이미지 URL */
  #currentImageURL = null;
  /** @private 이미지 인덱스 배열 */
  #imageIndices = [];
  /** @private 원본 인덱스 배열 (초기화용) */
  #originalImageIndices = [];
  /** @private 클릭 이벤트 핸들러 */
  #clickHandler = null;
  /** @private rem 값에 대한 크기 계산 캐시 */
  #cachedRemValues = new Map();
  /** @private 프리로드된 이미지 캐시 */
  #preloadedImages = new Map();
  /** @private 마우스 오버로 인한 일시정지 상태 */
  #isPaused = false;
  /** @private 일시정지 시 남은 지연 시간 */
  #pausedDelay = 0;
  /** @private 타이머 시작 시간 */
  #pauseStartTime = 0;

  /**
   * 생성자
   * @param {Object} options - 컴포넌트 옵션
   * @param {number} options.rem - 컴포넌트 크기 (rem 단위)
   * @param {string} options.shape - 모양 ('circle'|'square'|'rounded')
   * @param {string} options.effect - 효과 ('emboss'|'engrave')
   * @param {number} options.duration - 애니메이션 지속시간 (ms)
   * @param {boolean} options.eventAllow - 클릭 이벤트 허용 여부
   */
  constructor(options = DEFAULT_OPTIONS) {
    super();
    this.classList.add(...CSS_CLASSES.base);
    this.image = this.appendChild(document.createElement('div'));
    this.setOptions(options);
  }

  /**
   * DOM 연결 시 호출되는 라이프사이클 메서드
   * @protected
   */
  connectedCallback() {
    console.debug('[ImageCircle] DOM에 연결됨');
    this.#initializeEventHandlers();
    this.start();
  }

  /**
   * DOM 분리 시 호출되는 라이프사이클 메서드
   * @protected
   */
  disconnectedCallback() {
    console.debug('[ImageCircle] DOM에서 분리됨');
    this.stop();
  }

  /**
   * 이벤트 핸들러 초기화
   * @private
   */
  #initializeEventHandlers() {
    this.#setupMouseEvents();
    this.#setupClickHandler();
  }

  #setupClickHandler() {
    console.debug('[ImageCircle] 클릭 핸들러 설정 중');
    this.#clickHandler = (e) => {
      e.stopPropagation(); // 이벤트 전파 방지
      // Calculate center position of the current window
      const [w, h] = [100, 100]; // 팝업 크기 (100px x 100px)
      const centerX = window.screenX + window.innerWidth / 2 - w / 2;
      const centerY = window.screenY + window.innerHeight / 2 - h / 2;
      const idx = this.dataset.idx || 0; // 현재 이미지 인덱스

      console.debug(`[ImageCircle] 이미지 팝업 열기 - idx: ${idx}`);
      window.open(`popup.image.html#${idx}`, `image${idx}`, `top=${centerY},left=${centerX},width=${w}px,height=${h}px`);
    };
    this.image.addEventListener('click', this.#clickHandler);
  }

  #setupMouseEvents() {
    console.debug('[ImageCircle] 마우스 이벤트 핸들러 설정 중');

    this.image.addEventListener('mouseenter', () => {
      if (!this.#isActive || this.#isPaused) return;

      console.debug('[ImageCircle] 🎬 마우스 오버 - 애니메이션 일시정지');
      this.#pauseAnimation();
    });

    this.image.addEventListener('mouseleave', () => {
      if (!this.#isActive || !this.#isPaused) return;

      console.debug('[ImageCircle] 🎬 마우스 아웃 - 애니메이션 재개');
      this.#resumeAnimation();
    });
  }

  /**
   * 애니메이션 일시정지
   * @private
   */
  #pauseAnimation() {
    if (!this.#timeoutId) return;

    // 현재 타이머의 남은 시간 계산
    const elapsedTime = Date.now() - this.#pauseStartTime;
    this.#pausedDelay = Math.max(0, this.#pausedDelay - elapsedTime);

    clearTimeout(this.#timeoutId);
    this.#timeoutId = null;
    this.#isPaused = true;

    console.debug(`[ImageCircle] 애니메이션 일시정지 - 남은 시간: ${this.#pausedDelay}ms`);
  }

  /**
   * 애니메이션 재개
   * @private
   */
  #resumeAnimation() {
    if (!this.#isPaused) return;

    this.#isPaused = false;

    // 남은 시간이 있으면 그 시간만큼 기다린 후 다음 이미지 표시
    const resumeDelay = this.#pausedDelay > 0 ? this.#pausedDelay : TIMING.resumeMinDelay;

    console.debug(`[ImageCircle] 애니메이션 재개 - ${resumeDelay}ms 후 다음 이미지 표시`);

    // 재개를 위한 새로운 시작시간 설정
    this.#pauseStartTime = Date.now();
    this.#pausedDelay = resumeDelay; // 남은 시간으로 업데이트

    this.#timeoutId = setTimeout(() => {
      this.#scheduleNextImage();
    }, resumeDelay);
  }

  start() {
    if (this.#isActive) return; // 이미 활성화된 경우 중복 실행 방지
    console.debug('[ImageCircle] 이미지 순환 애니메이션 시작');
    this.#isActive = true;

    FlayFetch.getImageSize()
      .then(async (imageLength) => {
        if (imageLength === 0) throw new Error('표시할 이미지가 없습니다.');

        console.debug(`[ImageCircle] 표시할 이미지 ${imageLength}개 발견`);
        this.#imageIndices = Array.from({ length: imageLength }, (_, i) => i);
        this.#originalImageIndices = [...this.#imageIndices];

        // 초기 프리로딩 시작
        console.debug('[ImageCircle] 초기 프리로딩 시작');
        this.#preloadNextImages();

        this.#scheduleNextImage();
      })
      .catch((error) => {
        console.error('이미지 갯수를 가져오는 중 오류 발생:', error);
        this.#isActive = false;
      });
  }

  stop() {
    console.debug('[ImageCircle] 이미지 순환 애니메이션 중지');
    this.#isActive = false;

    // 타이머 정리
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
      console.debug('[ImageCircle] 애니메이션 타이머 정리 완료');
    }

    // 일시정지 상태 초기화
    this.#isPaused = false;
    this.#pausedDelay = 0;
    this.#pauseStartTime = 0;

    // 이미지 URL 정리
    this.#cleanupImageURL();

    // 프리로드된 이미지 정리
    this.#cleanupPreloadedImages();

    // 이벤트 리스너 정리
    if (this.#clickHandler) {
      this.image.removeEventListener('click', this.#clickHandler);
      this.#clickHandler = null;
      console.debug('[ImageCircle] 클릭 이벤트 리스너 제거 완료');
    }

    // 캐시 정리
    this.#cachedRemValues.clear();
    console.debug('[ImageCircle] 모든 캐시 및 리소스 정리 완료');
  }

  #cleanupImageURL() {
    if (this.#currentImageURL) {
      URL.revokeObjectURL(this.#currentImageURL);
      this.#currentImageURL = null;
    }
  }

  #cleanupPreloadedImages() {
    const preloadedCount = this.#preloadedImages.size;
    for (const [idx, imageURL] of this.#preloadedImages) {
      URL.revokeObjectURL(imageURL);
    }
    this.#preloadedImages.clear();
    console.debug(`[ImageCircle] 프리로드된 이미지 ${preloadedCount}개 정리 완료`);
  }

  /**
   * 다음 이미지 표시 스케줄링
   * @private
   */
  #scheduleNextImage() {
    if (!this.#isActive) return;

    const randomSize = this.#getRandomSize();
    console.debug(`[ImageCircle] 다음 이미지 스케줄링 - 크기: ${randomSize}rem`);
    this.#showImage(randomSize);

    const delay = TIMING.minDelay + (randomSize % 10) * TIMING.delayMultiplier;
    console.debug(`[ImageCircle] 다음 이미지 ${delay}ms 후 표시 예정`);

    // 일시정지 기능을 위해 지연시간과 시작시간 저장
    this.#pausedDelay = delay;
    this.#pauseStartTime = Date.now();

    this.#timeoutId = setTimeout(() => {
      this.#scheduleNextImage();
    }, delay);
  }

  /**
   * 랜덤 크기 계산 (캐시 사용)
   * @returns {number} 계산된 크기
   */
  #getRandomSize() {
    const rem = this.#opts.rem;
    const cacheKey = rem;

    if (!this.#cachedRemValues.has(cacheKey)) {
      console.debug(`[ImageCircle] rem 값 캐싱 중 - rem: ${rem}`);
      this.#cachedRemValues.set(cacheKey, {
        min: rem / 2,
        range: rem - 1,
      });
    }

    const cached = this.#cachedRemValues.get(cacheKey);
    const size = cached.min + Math.floor(Math.random() * cached.range) / 2;
    console.debug(`[ImageCircle] 랜덤 크기 생성: ${size}rem (캐시 사용: ${this.#cachedRemValues.has(cacheKey)})`);
    return size;
  }

  #showImage(randomSize) {
    if (!this.#isActive) return;

    this.#cleanupImageURL(); // 이전 이미지 URL 정리

    let idx;

    // 프리로드된 이미지가 있으면 우선 사용
    if (this.#preloadedImages.size > 0) {
      // 프리로드된 이미지 중 하나를 랜덤 선택
      const preloadedIndices = Array.from(this.#preloadedImages.keys());
      const randomPreloadedIndex = Math.floor(Math.random() * preloadedIndices.length);
      idx = preloadedIndices[randomPreloadedIndex];

      console.group(`🎯 이미지 표시 - idx: ${idx} (프리로드됨)`);
      console.debug(`[ImageCircle] 🎯 프리로드된 이미지 선택 - idx: ${idx} (프리로드 캐시: ${this.#preloadedImages.size}개)`);
      this.#usePreloadedImage(idx, randomSize);
      this.#preloadNextImages(); // 다음 이미지들 프리로드
      console.groupEnd();
      return;
    }

    // 프리로드된 이미지가 없으면 일반 방식으로 선택
    if (this.#imageIndices.length === 0) {
      console.debug('[ImageCircle] 이미지 인덱스 배열 재초기화');
      this.#imageIndices = [...this.#originalImageIndices]; // 배열 재초기화
    }
    const randomIndex = Math.floor(Math.random() * this.#imageIndices.length);
    idx = this.#imageIndices.splice(randomIndex, 1)[0];

    console.group(`🎯 이미지 표시 - idx: ${idx}`);
    console.debug(`[ImageCircle] 🎯 이미지 선택 - idx: ${idx} (남은 개수: ${this.#imageIndices.length})`);

    console.debug(`[ImageCircle] 📥 이미지 가져오는 중 - idx: ${idx}`);
    FlayFetch.getStaticImage(idx)
      .then(({ name, path, modified, imageBlob }) => {
        if (!this.#isActive) {
          console.groupEnd();
          return; // 비활성화된 경우 처리 중단
        }

        this.#currentImageURL = URL.createObjectURL(imageBlob);
        console.debug(`[ImageCircle] ✅ 이미지 로딩 성공: ${name}`);
        this.#displayImage(idx, randomSize, name, path, modified);
        this.#preloadNextImages(); // 다음 이미지들 프리로드
        console.groupEnd();
      })
      .catch((error) => {
        console.error(`[ImageCircle] 이미지(idx: ${idx})를 가져오는 중 오류 발생:`, error);
        if (this.#isActive && this.#imageIndices.length > 0) {
          // 오류 발생 시 다음 이미지 즉시 시도 (재귀 호출 대신 스케줄링 사용)          console.debug(`[ImageCircle] ${TIMING.errorRetryDelay}ms 후 다른 이미지로 재시도`);

          // 재시도를 위한 지연시간과 시작시간 저장
          this.#pausedDelay = TIMING.errorRetryDelay;
          this.#pauseStartTime = Date.now();

          this.#timeoutId = setTimeout(() => {
            this.#showImage(randomSize);
          }, TIMING.errorRetryDelay); // 짧은 지연 후 재시도
        }
        console.groupEnd();
      });
  }

  /**
   * 프리로드된 이미지 사용
   * @param {number} idx 이미지 인덱스
   * @param {number} randomSize 랜덤 크기
   */
  #usePreloadedImage(idx, randomSize) {
    console.debug(`[ImageCircle] 프리로드된 이미지 사용 - idx: ${idx}, 크기: ${randomSize}rem`);
    this.#currentImageURL = this.#preloadedImages.get(idx);
    this.#preloadedImages.delete(idx);

    // 사용된 인덱스를 일반 선택 배열에서도 제거
    const indexInArray = this.#imageIndices.indexOf(idx);
    if (indexInArray !== -1) {
      this.#imageIndices.splice(indexInArray, 1);
      console.debug(`[ImageCircle] 사용된 인덱스 ${idx}를 선택 배열에서 제거 (남은 개수: ${this.#imageIndices.length})`);
    }

    // 캐시된 메타데이터가 있다면 사용, 없다면 기본값
    const metadata = this.#getImageMetadata(idx);
    this.#displayImage(idx, randomSize, metadata.name, metadata.path, metadata.modified);
  }

  /**
   * 이미지 메타데이터 가져오기 (캐시 우선)
   * @param {number} idx 이미지 인덱스
   * @returns {object} 메타데이터
   */
  #getImageMetadata(idx) {
    // 실제 구현에서는 메타데이터 캐시를 사용할 수 있지만,
    // 현재는 기본값 반환
    return {
      name: `Image ${idx}`,
      path: '',
      modified: '',
    };
  }

  /**
   * 이미지 표시
   * @param {number} idx 이미지 인덱스
   * @param {number} randomSize 랜덤 크기
   * @param {string} name 이미지 이름
   * @param {string} path 이미지 경로
   * @param {string} modified 수정 시간
   */
  #displayImage(idx, randomSize, name, path, modified) {
    console.debug(`[ImageCircle] 이미지 표시 - idx: ${idx}, 크기: ${randomSize}rem, 이름: ${name}`);
    // DOM 업데이트를 배치로 처리하여 리플로우 최소화
    requestAnimationFrame(() => {
      if (!this.#isActive) return;

      console.group(`🎨 DOM 업데이트 - idx: ${idx}`);

      this.dataset.idx = idx;
      this.dataset.size = randomSize;
      this.image.title = `${name}\n${modified}\n${path}`;

      // 스타일 변경을 한 번에 처리
      const marginValue = (this.#opts.rem - randomSize) / 2 + 'rem';
      const sizeValue = randomSize + 'rem';

      Object.assign(this.image.style, {
        backgroundImage: `url(${this.#currentImageURL})`,
        width: sizeValue,
        height: sizeValue,
        margin: marginValue,
      }); // 애니메이션 옵션을 동적으로 생성하지 않고 상수 사용
      this.image.animate(ANIMATION.keyframes, {
        duration: this.#opts.duration,
        ...ANIMATION.options,
      });
      console.debug(`[ImageCircle] 애니메이션 시작 - idx: ${idx}, 지속시간: ${this.#opts.duration}ms`);
      console.groupEnd();
    });
  }

  /**
   * 다음 이미지들 프리로드 (최대 3개)
   */ /**
   * 다음 이미지들 프리로드
   * @private
   */
  #preloadNextImages() {
    if (this.#preloadedImages.size >= CACHE.maxPreloadedImages || this.#originalImageIndices.length === 0) return;

    const preloadCount = Math.min(CACHE.maxPreloadedImages - this.#preloadedImages.size, CACHE.maxPreloadedImages);
    console.debug(`[ImageCircle] 이미지 프리로딩 중 - ${preloadCount}개 (현재 캐시: ${this.#preloadedImages.size}/${CACHE.maxPreloadedImages})`);

    for (let i = 0; i < preloadCount; i++) {
      // 전체 이미지 인덱스에서 랜덤 선택 (아직 프리로드되지 않은 것만)
      const availableIndices = this.#originalImageIndices.filter((idx) => !this.#preloadedImages.has(idx));
      if (availableIndices.length === 0) break;

      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const idx = availableIndices[randomIndex];

      console.group(`📦 프리로드 - idx: ${idx}`);
      console.debug(`[ImageCircle] 이미지 프리로드 시작 - idx: ${idx}`);
      FlayFetch.getStaticImage(idx)
        .then(({ imageBlob }) => {
          if (this.#isActive && !this.#preloadedImages.has(idx)) {
            this.#preloadedImages.set(idx, URL.createObjectURL(imageBlob));
            console.debug(`[ImageCircle] 이미지 프리로드 성공 - idx: ${idx} (캐시 크기: ${this.#preloadedImages.size})`);
          }
          console.groupEnd();
        })
        .catch(() => {
          console.debug(`[ImageCircle] 이미지 프리로드 실패 - idx: ${idx}`);
          // 프리로드 실패는 조용히 처리
          console.groupEnd();
        });
    }
  }

  /**
   * 옵션 설정
   * @param {{ rem: string; shape: string; effect: string; duration: number; eventAllow: boolean; }} opts
   */
  setOptions(opts) {
    console.debug('[ImageCircle] 옵션 설정 중:', opts);
    const previousRem = this.#opts.rem;
    this.#opts = { ...this.#opts, ...opts }; // 기본 옵션과 병합

    // rem 값이 변경된 경우 캐시 무효화
    if (previousRem !== this.#opts.rem) {
      console.debug(`[ImageCircle] rem 값 변경됨 ${previousRem} → ${this.#opts.rem}, 캐시 초기화`);
      this.#cachedRemValues.clear();
    }

    // 스타일 업데이트를 배치로 처리
    requestAnimationFrame(() => {
      const remValue = this.#opts.rem;
      const imageRemValue = remValue - 1;

      Object.assign(this.style, {
        width: remValue + 'rem',
        height: remValue + 'rem',
      });

      Object.assign(this.image.style, {
        width: imageRemValue + 'rem',
        height: imageRemValue + 'rem',
      }); // 클래스 업데이트 최적화
      const currentClasses = [...this.classList];
      const classesToRemove = currentClasses.filter((cls) => Object.values(CSS_CLASSES.shapes).includes(cls) || Object.values(CSS_CLASSES.effects).includes(cls));

      if (classesToRemove.length > 0) {
        this.classList.remove(...classesToRemove);
        console.debug(`[ImageCircle] 클래스 제거: ${classesToRemove.join(', ')}`);
      }

      if (CSS_CLASSES.shapes[this.#opts.shape]) this.classList.add(CSS_CLASSES.shapes[this.#opts.shape]);
      if (CSS_CLASSES.effects[this.#opts.effect]) this.classList.add(CSS_CLASSES.effects[this.#opts.effect]);
      this.classList.toggle('event-allow', this.#opts.eventAllow);

      console.debug(`[ImageCircle] 스타일 적용 완료 - rem: ${remValue}, 모양: ${this.#opts.shape}, 효과: ${this.#opts.effect}, 이벤트허용: ${this.#opts.eventAllow}`);
    });
  }
}

customElements.define('image-circle', ImageCircle, { extends: 'div' });
