/**
 * 이미지 원형 표시 컴포넌트
 *
 * @version 2.1.0
 */
import FlayFetch from '@lib/FlayFetch';
import './imageCircle.scss';

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
  resumeMinDelay: 100, // 애니메이션 재개 최소 지연 시간 (ms)
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
 * - 마우스 인터랙션 지원 (일시정지/재개)
 *
 * @class ImageCircle
 * @extends {HTMLDivElement}
 */
export class ImageCircle extends HTMLDivElement {
  /** 옵션 설정 */
  #opts = DEFAULT_OPTIONS;
  /** 컴포넌트 활성 상태 */
  #isActive = false;
  /** 타이머 ID */
  #timeoutId = null;
  /** 현재 이미지 URL */
  #currentImageURL = null;
  /** 이미지 인덱스 배열 */
  #imageIndices = [];
  /** 마우스 오버로 인한 일시정지 상태 */
  #isPaused = false;
  /** 일시정지 시 남은 지연 시간 */
  #pausedDelay = 0;
  /** 타이머 시작 시간 */
  #pauseStartTime = 0;
  /** image length */
  #imageLength = 0;
  /** 이미지 요소 */
  image = null;

  /**
   * 생성자
   * @param {DEFAULT_OPTIONS} options - 컴포넌트 옵션
   */
  constructor(options = DEFAULT_OPTIONS) {
    super();

    this.classList.add(...CSS_CLASSES.base);
    this.image = this.appendChild(document.createElement('div'));
    this.setOptions(options);
  }

  /**
   * DOM 연결 시 호출되는 라이프사이클 메서드
   */
  connectedCallback() {
    this.#initializeEventHandlers();
    this.start();
  }

  /**
   * 이벤트 핸들러 초기화
   */
  #initializeEventHandlers() {
    this.image.addEventListener('click', (e) => {
      e.stopPropagation(); // 이벤트 전파 방지
      const [w, h] = [100, 100]; // 팝업 크기 (100px x 100px)
      const centerX = window.screenX + window.innerWidth / 2 - w / 2;
      const centerY = window.screenY + window.innerHeight / 2 - h / 2;
      const idx = this.dataset.idx || 0; // 현재 이미지 인덱스
      window.open(`popup.image.html#${idx}`, `image${idx}`, `top=${centerY},left=${centerX},width=${w}px,height=${h}px`);
    });

    this.image.addEventListener('mouseenter', () => {
      if (!this.#isActive || this.#isPaused) return;
      this.#pauseAnimation();
    });

    this.image.addEventListener('mouseleave', () => {
      if (!this.#isActive || !this.#isPaused) return;
      this.#resumeAnimation();
    });
  }

  /**
   * 애니메이션 일시정지
   */
  #pauseAnimation() {
    if (!this.#timeoutId) return;

    clearTimeout(this.#timeoutId);

    const elapsedTime = Date.now() - this.#pauseStartTime; // 현재 타이머의 남은 시간 계산
    this.#pausedDelay = Math.max(0, this.#pausedDelay - elapsedTime);
    this.#timeoutId = null;
    this.#isPaused = true;

    console.debug(`[ImageCircle] 애니메이션 일시정지 - 남은 시간: ${this.#pausedDelay}ms`);
  }

  /**
   * 애니메이션 재개
   */
  #resumeAnimation() {
    if (!this.#isPaused) return;

    const resumeDelay = this.#pausedDelay > 0 ? this.#pausedDelay : TIMING.resumeMinDelay; // 남은 시간이 있으면 그 시간만큼 기다린 후 다음 이미지 표시
    this.#pauseStartTime = Date.now();
    this.#pausedDelay = resumeDelay; // 남은 시간으로 업데이트
    this.#timeoutId = setTimeout(() => this.#scheduleNextImage(), resumeDelay);
    this.#isPaused = false;

    console.debug(`[ImageCircle] 애니메이션 재개 - ${resumeDelay}ms 후 다음 이미지 표시`);
  }

  async start() {
    if (this.#isActive) return; // 이미 활성화된 경우 중복 실행 방지
    this.#isActive = true;

    try {
      this.#imageLength = await FlayFetch.getImageSize();
      if (this.#imageLength === 0) throw new Error('표시할 이미지가 없습니다.');
      console.debug(`[ImageCircle] 표시할 이미지 ${this.#imageLength}개 발견`);

      this.#imageIndices = Array.from({ length: this.#imageLength }, (_, i) => i);

      this.#scheduleNextImage();
    } catch (error) {
      console.error('이미지 갯수를 가져오는 중 오류 발생:', error);
      this.#isActive = false;
    }
  }

  /**
   * 다음 이미지 표시
   */
  #scheduleNextImage() {
    if (!this.#isActive) return;

    const getRandomSize = () => {
      const min = this.#opts.rem / 2;
      const range = this.#opts.rem - 1;
      return min + Math.floor(Math.random() * range) / 2;
    };
    const randomSize = getRandomSize();
    const delay = TIMING.minDelay + (randomSize % 10) * TIMING.delayMultiplier;

    this.#showImage(randomSize);

    this.#pausedDelay = delay;
    this.#pauseStartTime = Date.now();
    this.#timeoutId = setTimeout(() => this.#scheduleNextImage(), delay);

    console.debug(`[ImageCircle] 다음 이미지 ${delay}ms 후 표시 예정`);
  }

  async #showImage(randomSize) {
    if (this.#currentImageURL) {
      URL.revokeObjectURL(this.#currentImageURL);
      this.#currentImageURL = null;
    }

    if (this.#imageIndices.length === 0) {
      console.debug('[ImageCircle] 이미지 인덱스 배열 재초기화');
      this.#imageIndices = Array.from({ length: this.#imageLength }, (_, i) => i);
    }

    const randomIndex = Math.floor(Math.random() * this.#imageIndices.length);
    const idx = this.#imageIndices.splice(randomIndex, 1)[0];

    console.debug(`[ImageCircle] 🎯 이미지 선택 - idx: ${idx} (남은 개수: ${this.#imageIndices.length})`);

    const { name, path, modified, imageBlob } = await FlayFetch.getStaticImage(idx);
    this.#currentImageURL = URL.createObjectURL(imageBlob);

    this.dataset.idx = idx;
    this.dataset.size = randomSize;
    this.image.title = `${name}\n${modified}\n${path}`;

    // DOM 업데이트를 배치로 처리하여 리플로우 최소화
    requestAnimationFrame(() => {
      Object.assign(this.image.style, {
        backgroundImage: `url(${this.#currentImageURL})`,
        width: randomSize + 'rem',
        height: randomSize + 'rem',
        margin: (this.#opts.rem - randomSize) / 2 + 'rem',
      });

      this.image.animate(ANIMATION.keyframes, { duration: this.#opts.duration, ...ANIMATION.options });
    });
  }

  /**
   * 옵션 설정
   * @param {DEFAULT_OPTIONS} opts
   */
  setOptions(opts) {
    console.debug('[ImageCircle] 옵션 설정 중:', opts);
    this.#opts = { ...this.#opts, ...opts }; // 기본 옵션과 병합

    // 스타일 업데이트를 배치로 처리
    requestAnimationFrame(() => {
      Object.assign(this.style, {
        width: this.#opts.rem + 'rem',
        height: this.#opts.rem + 'rem',
      });

      Object.assign(this.image.style, {
        width: this.#opts.rem - 1 + 'rem',
        height: this.#opts.rem - 1 + 'rem',
      });

      // 클래스 업데이트 최적화
      const currentClasses = [...this.classList];
      const classesToRemove = currentClasses.filter((cls) => Object.values(CSS_CLASSES.shapes).includes(cls) || Object.values(CSS_CLASSES.effects).includes(cls));
      if (classesToRemove.length > 0) {
        this.classList.remove(...classesToRemove);
      }

      if (CSS_CLASSES.shapes[this.#opts.shape]) this.classList.add(CSS_CLASSES.shapes[this.#opts.shape]);
      if (CSS_CLASSES.effects[this.#opts.effect]) this.classList.add(CSS_CLASSES.effects[this.#opts.effect]);
      this.classList.toggle('event-allow', this.#opts.eventAllow);

      console.debug(`[ImageCircle] 스타일 적용 완료 - rem: ${this.#opts.rem}, 모양: ${this.#opts.shape}, 효과: ${this.#opts.effect}, 이벤트허용: ${this.#opts.eventAllow}`);
    });
  }
}

customElements.define('image-circle', ImageCircle, { extends: 'div' });
