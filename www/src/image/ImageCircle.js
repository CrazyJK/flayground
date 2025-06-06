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
  minDelay: 5000, // Minimum delay time (ms)
  delayMultiplier: 1000, // Delay multiplier
  resumeMinDelay: 100, // Minimum delay time for resuming animation (ms)
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

  constructor(options = DEFAULT_OPTIONS) {
    super();

    this.classList.add(...CSS_CLASSES.base);
    this.image = this.appendChild(document.createElement('div'));
    this.setOptions(options);
  }

  connectedCallback() {
    this.#initializeEventHandlers();
    this.start();
  }

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

    const elapsedTime = Date.now() - this.#pauseStartTime; // Calculate the remaining time of current timer
    this.#pausedDelay = Math.max(0, this.#pausedDelay - elapsedTime);
    this.#timeoutId = null;
    this.#isPaused = true;

    console.debug(`[ImageCircle] Animation paused - Remaining time: ${this.#pausedDelay}ms`);
  }

  /**
   * 애니메이션 재개
   */
  #resumeAnimation() {
    if (!this.#isPaused) return;

    const resumeDelay = this.#pausedDelay > 0 ? this.#pausedDelay : TIMING.resumeMinDelay; // Wait for remaining time or minimum delay before showing next image
    this.#pauseStartTime = Date.now();
    this.#pausedDelay = resumeDelay; // Update with remaining time
    this.#timeoutId = setTimeout(() => this.#scheduleNextImage(), resumeDelay);
    this.#isPaused = false;

    console.debug(`[ImageCircle] Animation resumed - Next image will be displayed after ${resumeDelay}ms`);
  }

  async start() {
    if (this.#isActive) return; // 이미 활성화된 경우 중복 실행 방지
    this.#isActive = true;

    try {
      this.#imageLength = await FlayFetch.getImageSize();
      if (this.#imageLength === 0) throw new Error('No images to display.');
      console.debug(`[ImageCircle] Found ${this.#imageLength} images to display`);

      this.#imageIndices = Array.from({ length: this.#imageLength }, (_, i) => i);

      this.#scheduleNextImage();
    } catch (error) {
      console.error('Error while fetching image count:', error);
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

    this.#pauseStartTime = Date.now();
    this.#pausedDelay = delay;
    this.#timeoutId = setTimeout(() => this.#scheduleNextImage(), delay);
  }

  async #showImage(randomSize) {
    console.group('[ImageCircle] show image');
    try {
      if (this.#currentImageURL) {
        URL.revokeObjectURL(this.#currentImageURL);
        this.#currentImageURL = null;
      }

      if (this.#imageIndices.length === 0) {
        console.debug('Resetting image indices');
        this.#imageIndices = Array.from({ length: this.#imageLength }, (_, i) => i);
      }

      const randomIndex = Math.floor(Math.random() * this.#imageIndices.length);
      const idx = this.#imageIndices.splice(randomIndex, 1)[0];
      console.debug(`Image index: ${idx}, Remaining indices: ${this.#imageIndices.length}`);

      const { name, path, modified, imageBlob } = await FlayFetch.getStaticImage(idx);
      console.debug(`Image information: \n\tName: ${name} \n\tPath: ${path} \n\tDate: ${modified} \n\tSize: ${randomSize}rem`);

      this.#currentImageURL = URL.createObjectURL(imageBlob);

      this.dataset.idx = idx;
      this.image.title = `${name}\n${path}\n${modified}`;

      // Batch DOM updates to minimize reflow
      requestAnimationFrame(() => {
        Object.assign(this.image.style, {
          backgroundImage: `url(${this.#currentImageURL})`,
          width: randomSize + 'rem',
          height: randomSize + 'rem',
        });

        this.image.animate(ANIMATION.keyframes, { duration: this.#opts.duration, ...ANIMATION.options });
      });
    } catch (error) {
      console.error('[ImageCircle] Error while displaying image:', error);
      this.#isActive = false; // Deactivate on error
      if (this.#timeoutId) {
        clearTimeout(this.#timeoutId);
        this.#timeoutId = null;
      }
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Set options
   * @param {DEFAULT_OPTIONS} opts
   */
  setOptions(opts) {
    console.debug('[ImageCircle] Setting options:', opts);
    this.#opts = { ...this.#opts, ...opts }; // Merge with default options

    // Batch style updates
    requestAnimationFrame(() => {
      Object.assign(this.style, {
        width: `${this.#opts.rem}rem`,
        height: `${this.#opts.rem}rem`,
      });

      Object.assign(this.image.style, {
        width: `${this.#opts.rem - 1}rem`,
        height: `${this.#opts.rem - 1}rem`,
      });

      // Optimize class updates
      const currentClasses = [...this.classList];
      const classesToRemove = currentClasses.filter((cls) => Object.values(CSS_CLASSES.shapes).includes(cls) || Object.values(CSS_CLASSES.effects).includes(cls));
      if (classesToRemove.length > 0) {
        this.classList.remove(...classesToRemove);
      }

      if (CSS_CLASSES.shapes[this.#opts.shape]) this.classList.add(CSS_CLASSES.shapes[this.#opts.shape]);
      if (CSS_CLASSES.effects[this.#opts.effect]) this.classList.add(CSS_CLASSES.effects[this.#opts.effect]);
      this.classList.toggle('event-allow', this.#opts.eventAllow);

      console.debug(`[ImageCircle] Style applied \n\trem: ${this.#opts.rem} \n\tshape: ${this.#opts.shape} \n\teffect: ${this.#opts.effect} \n\tevent allowed: ${this.#opts.eventAllow} \n\tduration: ${this.#opts.duration}ms`);
    });
  }
}

customElements.define('image-circle', ImageCircle, { extends: 'div' });
