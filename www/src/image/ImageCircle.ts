/**
 * 이미지 원형 표시 컴포넌트
 *
 * @version 2.1.0
 */
import { ColorFrequency, getDominatedColors } from '@lib/dominatedColor';
import FlayFetch, { ImageData } from '@lib/FlayFetch';
import StyleUtils from '../lib/StyleUtils';
import './imageCircle.scss';

// 타입 정의
export type ShapeType = 'circle' | 'square' | 'rounded';
export type EffectType = 'emboss' | 'engrave';

/**
 *  이미지 원형 표시 옵션 인터페이스
 * - rem: 이미지 크기 (rem 단위)
 * - shape: 이미지 모양 (circle, square, rounded 중 하나)
 * - effect: 이미지 효과 (emboss, engrave 중 하나)
 * - duration: 애니메이션 지속 시간 (ms)
 * - eventAllow: 이벤트 허용 여부
 */
export interface ImageCircleOptions {
  rem: number;
  shape: ShapeType;
  effect: EffectType;
  duration: number;
  eventAllow: boolean;
}

const CSS_CLASSES = {
  base: ['image-circle', 'flay-div'] as const,
  shapes: { circle: 'circle', square: 'square', rounded: 'rounded' } as const,
  effects: { emboss: 'emboss', engrave: 'engrave' } as const,
  event: 'event-allow' as const,
} as const;

const ANIMATION = {
  keyframes: [{ transform: 'scale(0.1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
  options: { easing: 'ease-in-out' },
} as const;

const TIMING = {
  minDelay: 5000, // Minimum delay time (ms)
  delayMultiplier: 1000, // Delay multiplier
  resumeMinDelay: 100, // Minimum delay time for resuming animation (ms)
} as const;

/**
 * 이미지 원형 표시 웹 컴포넌트
 * - 설정 가능한 모양과 효과를 가진 순환 이미지 표시
 * - 마우스 인터랙션 지원 (일시정지/재개)
 *
 * @class ImageCircle
 * @extends {HTMLDivElement}
 */
export class ImageCircle extends HTMLDivElement {
  static readonly DEFAULT_OPTIONS: ImageCircleOptions = {
    rem: 10,
    shape: CSS_CLASSES.shapes.circle,
    effect: CSS_CLASSES.effects.emboss,
    duration: 2000,
    eventAllow: false,
  };
  static readonly FULL_MODE_OPTIONS = (element: HTMLElement): Partial<ImageCircleOptions> => ({
    rem: getAvailableRemSize(element),
    effect: ImageCircle.effectTypes.emboss as EffectType,
    duration: 3000,
    eventAllow: true,
  });

  /** 옵션 설정 */
  #opts = ImageCircle.FULL_MODE_OPTIONS(this.ownerDocument.documentElement as HTMLElement);
  /** 컴포넌트 활성 상태 */
  #isActive: boolean = false;
  /** 타이머 ID */
  #timeoutId: ReturnType<typeof setTimeout> | null = null;
  /** 현재 이미지 URL */
  #currentImageURL: string | null = null;
  /** 이미지 인덱스 배열 */
  #imageIndices: number[] = [];
  /** 마우스 오버로 인한 일시정지 상태 */
  #isPaused: boolean = false;
  /** 일시정지 시 남은 지연 시간 */
  #pausedDelay: number = 0;
  /** 타이머 시작 시간 */
  #pauseStartTime: number = 0;
  /** image length */
  #imageLength: number = 0;
  /** 이미지 요소 */
  image: HTMLDivElement | null = null;

  static shapeTypes = CSS_CLASSES.shapes;
  static effectTypes = CSS_CLASSES.effects;

  constructor(options: Partial<ImageCircleOptions> = {}) {
    super();

    this.classList.add(...CSS_CLASSES.base);
    this.image = this.appendChild(document.createElement('div'));
    this.setOptions(options);
  }

  connectedCallback(): void {
    this.#initializeEventHandlers();
    this.start();
  }

  disconnectedCallback(): void {
    // 타이머 정리
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }

    // 현재 이미지 URL 정리
    if (this.#currentImageURL) {
      URL.revokeObjectURL(this.#currentImageURL);
      this.#currentImageURL = null;
    }

    // 상태 초기화
    this.#isActive = false;
    this.#isPaused = false;
    this.#imageIndices = [];
    this.#pausedDelay = 0;
    this.#pauseStartTime = 0;
    this.#imageLength = 0;

    // CSS 변수 정리
    document.documentElement.style.removeProperty('--breathe-color');

    // 이벤트 리스너 정리 (이미지 요소가 존재하는 경우)
    if (this.image) {
      // 이미지 요소의 스타일 정리
      Object.assign(this.image.style, {
        backgroundImage: '',
        width: '',
        height: '',
      });

      // 데이터 속성 정리
      delete this.dataset.idx;
      this.image.title = '';
    }

    // 클래스 정리
    this.classList.remove('breathe-stop');

    console.debug('[ImageCircle] Component disconnected and cleaned up');
  }

  #initializeEventHandlers(): void {
    this.image.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation(); // 이벤트 전파 방지
      const [w, h] = [100, 100]; // 팝업 크기 (100px x 100px)
      const centerX = window.screenX + window.innerWidth / 2 - w / 2;
      const centerY = window.screenY + window.innerHeight / 2 - h / 2;
      const idx = parseInt(this.dataset.idx || '0', 10); // 현재 이미지 인덱스
      window.open(`popup.image.html#${idx}`, `image${idx}`, `top=${centerY},left=${centerX},width=${w}px,height=${h}px`);
      this.#resumeAnimation();
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
  #pauseAnimation(): void {
    if (!this.#timeoutId) return;

    this.classList.add('breathe-stop');
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
  #resumeAnimation(): void {
    if (!this.#isPaused) return;

    this.classList.remove('breathe-stop');

    const resumeDelay = this.#pausedDelay > 0 ? this.#pausedDelay : TIMING.resumeMinDelay; // Wait for remaining time or minimum delay before showing next image
    this.#pauseStartTime = Date.now();
    this.#pausedDelay = resumeDelay; // Update with remaining time
    this.#timeoutId = setTimeout(() => this.#scheduleNextImage(), resumeDelay);
    this.#isPaused = false;

    console.debug(`[ImageCircle] Animation resumed - Next image will be displayed after ${resumeDelay}ms`);
  }

  async start(): Promise<void> {
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
  #scheduleNextImage(): void {
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

  async #showImage(randomSize: number): Promise<void> {
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

      const { name, path, modified, imageBlob }: ImageData = await FlayFetch.getStaticImage(idx);
      console.debug(`Image information: \n\tName: ${name} \n\tPath: ${path} \n\tDate: ${modified} \n\tSize: ${randomSize}rem`);

      this.#currentImageURL = URL.createObjectURL(imageBlob);
      getDominatedColors(this.#currentImageURL, { scale: 0.5, offset: 16, limit: 1 }).then((colors: ColorFrequency[]) => {
        const rgba = colors.length > 0 ? colors[0].rgba : [255, 0, 0, 0.25];
        document.documentElement.style.setProperty('--breathe-color', `rgba(${rgba.join(',')})`);
      });

      this.dataset.idx = String(idx);
      this.image.title = `${name}\n${path}\n${modified}`;

      // Batch DOM updates to minimize reflow
      requestAnimationFrame(() => {
        Object.assign(this.image.style, {
          backgroundImage: `url(${this.#currentImageURL})`,
          width: randomSize + 'rem',
          height: randomSize + 'rem',
        });

        this.image.animate([...ANIMATION.keyframes], { duration: this.#opts.duration, ...ANIMATION.options });
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
   * @param opts - 설정할 옵션들
   */
  setOptions(opts: Partial<ImageCircleOptions> = {}): void {
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
      const shapeClasses = Object.values(CSS_CLASSES.shapes) as string[];
      const effectClasses = Object.values(CSS_CLASSES.effects) as string[];
      const classesToRemove = currentClasses.filter((cls) => shapeClasses.includes(cls) || effectClasses.includes(cls));
      if (classesToRemove.length > 0) {
        this.classList.remove(...classesToRemove);
      }

      this.classList.add(CSS_CLASSES.shapes[this.#opts.shape]);
      this.classList.add(CSS_CLASSES.effects[this.#opts.effect]);
      this.classList.toggle(CSS_CLASSES.event, this.#opts.eventAllow);

      console.debug(`[ImageCircle] Style applied \n\trem: ${this.#opts.rem} \n\tshape: ${this.#opts.shape} \n\teffect: ${this.#opts.effect} \n\tevent allowed: ${this.#opts.eventAllow} \n\tduration: ${this.#opts.duration}ms`);
    });
  }
}

customElements.define('image-circle', ImageCircle, { extends: 'div' });

/**
 * 주어진 요소에서 사용 가능한 rem 크기를 계산합니다.
 * @param element - 크기를 계산할 HTML 요소
 * @returns rem 단위로 계산된 사용 가능한 최소 크기
 */
function getAvailableRemSize(element: Element): number {
  const width = StyleUtils.getAvailableWidthInRem(element);
  const height = StyleUtils.getAvailableHeightInRem(element);
  return Math.floor(Math.min(width, height));
}
