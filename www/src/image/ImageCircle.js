/**
 * 이미지 원형 표시 컴포넌트 - 성능 최적화 버전
 *
 * 주요 성능 최적화 기능:
 * - 이미지 프리로딩 (최대 3개)
 * - rem 값 계산 캐싱
 * - DOM 업데이트 배치 처리 (requestAnimationFrame)
 * - 메모리 효율적인 리소스 관리
 * - 애니메이션 키프레임 재사용
 *
 * @author ImageCircle Performance Team
 * @version 2.0.0
 */
import FlayFetch from '@lib/FlayFetch';
import './imageCircle.scss';

const shapeClasses = { circle: 'circle', square: 'square', rounded: 'rounded' }; // 모양 클래스
const effectClasses = { emboss: 'emboss', engrave: 'engrave' }; // 효과 클래스
const DEFAULT_OPTIONS = { rem: 10, shape: shapeClasses.circle, effect: effectClasses.emboss, duration: 2000, eventAllow: false }; // 기본 옵션

// 성능 최적화 상수
const ANIMATION_KEYFRAMES = [{ transform: 'scale(0.1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }];
const ANIMATION_OPTIONS = { easing: 'ease-in-out' };
const MIN_DELAY = 5000; // 최소 지연 시간 (ms)
const DELAY_MULTIPLIER = 1000; // 지연 시간 배수
const ERROR_RETRY_DELAY = 100; // 오류 시 재시도 지연 시간 (ms)

export class ImageCircle extends HTMLDivElement {
  #opts = DEFAULT_OPTIONS; // 옵션
  #isActive = false; // 활성 상태
  #timeoutId = null; // 타이머 ID
  #currentImageURL = null; // 현재 이미지 URL
  #imageIndices = []; // 이미지 인덱스 배열
  #originalImageIndices = []; // 원본 인덱스 배열
  #clickHandler = null; // 클릭 핸들러
  #cachedRemValues = new Map(); // rem 값 캐시
  #preloadedImages = new Map(); // 프리로드된 이미지 캐시 (최대 3개)

  constructor(options = DEFAULT_OPTIONS) {
    super();
    this.classList.add('image-circle', 'flay-div');
    this.image = this.appendChild(document.createElement('div'));
    this.setOptions(options);
  }

  connectedCallback() {
    console.debug('[ImageCircle] DOM에 연결됨');
    this.#setupClickHandler();
    this.start();
  }

  disconnectedCallback() {
    console.debug('[ImageCircle] DOM에서 분리됨');
    this.stop();
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

  #scheduleNextImage() {
    if (!this.#isActive) return;

    const randomSize = this.#getRandomSize();
    console.debug(`%c[ImageCircle] 다음 이미지 스케줄링 - 크기: ${randomSize}rem`, 'color: #2196F3; font-weight: bold;');
    this.#showImage(randomSize);

    const delay = MIN_DELAY + (randomSize % 10) * DELAY_MULTIPLIER;
    console.debug(`[ImageCircle] 다음 이미지 ${delay}ms 후 표시 예정`);
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

      console.debug(`%c[ImageCircle] 🎯 프리로드된 이미지 선택 - idx: ${idx} (프리로드 캐시: ${this.#preloadedImages.size}개)`, 'color: #FF9800; font-weight: bold; padding: 2px 4px; border-radius: 3px;');
      this.#usePreloadedImage(idx, randomSize);
      this.#preloadNextImages(); // 다음 이미지들 프리로드
      return;
    }

    // 프리로드된 이미지가 없으면 일반 방식으로 선택
    if (this.#imageIndices.length === 0) {
      console.debug('[ImageCircle] 이미지 인덱스 배열 재초기화');
      this.#imageIndices = [...this.#originalImageIndices]; // 배열 재초기화
    }
    const randomIndex = Math.floor(Math.random() * this.#imageIndices.length);
    idx = this.#imageIndices.splice(randomIndex, 1)[0];
    console.debug(`%c[ImageCircle] 🎯 이미지 선택 - idx: ${idx} (남은 개수: ${this.#imageIndices.length})`, 'color: #FF9800; font-weight: bold; padding: 2px 4px; border-radius: 3px;');

    console.debug(`%c[ImageCircle] 📥 이미지 가져오는 중 - idx: ${idx}`, 'color:rgb(158, 141, 161); font-style: italic;');
    FlayFetch.getStaticImage(idx)
      .then(({ name, path, modified, imageBlob }) => {
        if (!this.#isActive) return; // 비활성화된 경우 처리 중단

        this.#currentImageURL = URL.createObjectURL(imageBlob);
        console.debug(`%c[ImageCircle] ✅ 이미지 로딩 성공: ${name}`, 'color: #4CAF50; font-weight: bold;');
        this.#displayImage(idx, randomSize, name, path, modified);
        this.#preloadNextImages(); // 다음 이미지들 프리로드
      })
      .catch((error) => {
        console.error(`이미지(idx: ${idx})를 가져오는 중 오류 발생:`, error);
        if (this.#isActive && this.#imageIndices.length > 0) {
          // 오류 발생 시 다음 이미지 즉시 시도 (재귀 호출 대신 스케줄링 사용)          console.debug(`[ImageCircle] ${ERROR_RETRY_DELAY}ms 후 다른 이미지로 재시도`);
          this.#timeoutId = setTimeout(() => {
            this.#showImage(randomSize);
          }, ERROR_RETRY_DELAY); // 짧은 지연 후 재시도
        }
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
      });

      // 애니메이션 옵션을 동적으로 생성하지 않고 상수 사용
      this.image.animate(ANIMATION_KEYFRAMES, {
        duration: this.#opts.duration,
        ...ANIMATION_OPTIONS,
      });
      console.debug(`[ImageCircle] 애니메이션 시작 - idx: ${idx}, 지속시간: ${this.#opts.duration}ms`);
    });
  }
  /**
   * 다음 이미지들 프리로드 (최대 3개)
   */
  #preloadNextImages() {
    if (this.#preloadedImages.size >= 3 || this.#originalImageIndices.length === 0) return;

    const preloadCount = Math.min(3 - this.#preloadedImages.size, 3);
    console.debug(`[ImageCircle] 이미지 프리로딩 중 - ${preloadCount}개 (현재 캐시: ${this.#preloadedImages.size}/3)`);

    for (let i = 0; i < preloadCount; i++) {
      // 전체 이미지 인덱스에서 랜덤 선택 (아직 프리로드되지 않은 것만)
      const availableIndices = this.#originalImageIndices.filter((idx) => !this.#preloadedImages.has(idx));
      if (availableIndices.length === 0) break;

      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const idx = availableIndices[randomIndex];

      console.debug(`[ImageCircle] 이미지 프리로드 시작 - idx: ${idx}`);
      FlayFetch.getStaticImage(idx)
        .then(({ imageBlob }) => {
          if (this.#isActive && !this.#preloadedImages.has(idx)) {
            this.#preloadedImages.set(idx, URL.createObjectURL(imageBlob));
            console.debug(`[ImageCircle] 이미지 프리로드 성공 - idx: ${idx} (캐시 크기: ${this.#preloadedImages.size})`);
          }
        })
        .catch(() => {
          console.debug(`[ImageCircle] 이미지 프리로드 실패 - idx: ${idx}`);
          // 프리로드 실패는 조용히 처리
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
      });

      // 클래스 업데이트 최적화
      const currentClasses = [...this.classList];
      const classesToRemove = currentClasses.filter((cls) => Object.values(shapeClasses).includes(cls) || Object.values(effectClasses).includes(cls));

      if (classesToRemove.length > 0) {
        this.classList.remove(...classesToRemove);
        console.debug(`[ImageCircle] 클래스 제거: ${classesToRemove.join(', ')}`);
      }

      if (shapeClasses[this.#opts.shape]) this.classList.add(shapeClasses[this.#opts.shape]);
      if (effectClasses[this.#opts.effect]) this.classList.add(effectClasses[this.#opts.effect]);
      this.classList.toggle('event-allow', this.#opts.eventAllow);

      console.debug(`[ImageCircle] 스타일 적용 완료 - rem: ${remValue}, 모양: ${this.#opts.shape}, 효과: ${this.#opts.effect}, 이벤트허용: ${this.#opts.eventAllow}`);
    });
  }
}

customElements.define('image-circle', ImageCircle, { extends: 'div' });
