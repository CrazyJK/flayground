import GroundImage from '@base/GroundImage';
import FlayFetch from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import { addResizeListener } from '@lib/windowAddEventListener';
import './ImageFall.scss';

const PANE_WIDTH = 360;

// 옵션 타입 정의
interface ImageFallOptions {
  mode: 'serial' | 'random';
  auto: boolean;
}

const DEFAULT_OPTS: ImageFallOptions = { mode: 'serial', auto: true };

export class ImageFall extends GroundImage {
  private timer: number = -1;
  private continue: boolean = true;
  private willRandom: boolean = false;

  private imageLength: number = -1;

  private imageIndexArray: number[] = [];
  private imageIndex: number = -1;

  private divIndexArray: number[] = [];
  private divIndex: number = -1;

  // 이벤트 리스너와 리소스 정리를 위한 변수들
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null;
  private removeResizeListener: (() => void) | null = null;
  private imageUrls: Set<string> = new Set(); // 생성된 이미지 URL들을 추적

  constructor(opts: Partial<ImageFallOptions> = DEFAULT_OPTS) {
    super();

    const { mode, auto } = { ...DEFAULT_OPTS, ...opts };
    this.continue = auto;
    this.willRandom = mode === 'random';
  }

  connectedCallback(): void {
    this.removeResizeListener = addResizeListener(() => this.#resizeDiv(), true);

    this.keyupHandler = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          this.continue = !this.continue;
          break;
        case 'KeyR':
          this.willRandom = true;
          break;
        case 'KeyF':
          this.willRandom = false;
          break;
      }
    };
    window.addEventListener('keyup', this.keyupHandler);

    void FlayFetch.getImageSize()
      .then((size: number) => (this.imageLength = size))
      .then(() => this.#resizeDiv())
      .then(() => this.#render());
  }

  disconnectedCallback(): void {
    // 타이머 정리
    if (this.timer !== -1) {
      clearInterval(this.timer);
      this.timer = -1;
    }

    // 이벤트 리스너 정리
    if (this.keyupHandler) {
      window.removeEventListener('keyup', this.keyupHandler);
      this.keyupHandler = null;
    }

    // 리사이즈 리스너 정리
    if (this.removeResizeListener) {
      this.removeResizeListener();
      this.removeResizeListener = null;
    }

    // 모든 이미지 URL 정리
    this.imageUrls.forEach((url: string) => {
      URL.revokeObjectURL(url);
    });
    this.imageUrls.clear();

    // 기존 이미지들의 URL 정리
    this.querySelectorAll('img').forEach((img: HTMLImageElement) => {
      if (img.src && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });

    // 상태 초기화
    this.continue = false;
    this.imageLength = -1;
    this.imageIndexArray = [];
    this.imageIndex = -1;
    this.divIndexArray = [];
    this.divIndex = -1;

    // DOM 정리
    this.innerHTML = '';

    console.debug('[ImageFall] Component disconnected and cleaned up');
  }

  #resizeDiv(): void {
    const paneCount = Math.round(this.clientWidth / PANE_WIDTH);
    const imageWrapList = this.querySelectorAll('.row > div');

    this.textContent = null;
    for (let i = 0; i < paneCount; i++) {
      this.innerHTML += `<div class="row"></div>`;
    }

    const divList = this.querySelectorAll('.row');
    imageWrapList.forEach((imageWrap: Element, index: number) => {
      const targetDiv = divList[index % divList.length];
      if (targetDiv && imageWrap instanceof HTMLElement) {
        targetDiv.append(imageWrap);
        imageWrap.style.height = 'auto';
      }
    });
  }

  #render(): void {
    this.timer = window.setInterval(() => {
      if (this.continue) void this.#addImage();
    }, 1000 * 3);
  }

  async #addImage(): Promise<void> {
    const divList = this.querySelectorAll('.row');
    const divIndex = this.#getDivIdx(divList.length);
    const imageIndex = this.#getImageIdx();

    const imageWrap = document.createElement('div');
    divList[divIndex]?.prepend(imageWrap);

    const { name, path, imageBlob } = await FlayFetch.getStaticImage(imageIndex);

    const image = new Image();
    const imageUrl = URL.createObjectURL(imageBlob);
    image.src = imageUrl;

    // 생성된 URL을 추적
    this.imageUrls.add(imageUrl);

    image.title = `Idx: ${imageIndex}\nName: ${name}\nPath: ${path}`;
    image.addEventListener('click', () => {
      window.open(`popup.image.html#${imageIndex}`, `image${imageIndex}`, `width=${image.naturalWidth}px,height=${image.naturalHeight}px`);
    });
    imageWrap.append(image);

    try {
      await image.decode();
    } catch (error) {
      URL.revokeObjectURL(imageUrl);
      this.imageUrls.delete(imageUrl);
      image.remove();
      imageWrap.remove();
      return;
    }

    imageWrap.style.height = `calc(${image.height}px + 1rem)`;
    imageWrap.style.top = '0';

    divList.forEach((div: Element) => {
      const images = div.querySelectorAll('div');
      if (images.length > 9) {
        const lastImage = div.querySelector('div:last-child');
        const lastImageElement = lastImage?.querySelector('img') as HTMLImageElement;
        if (lastImageElement?.src) {
          URL.revokeObjectURL(lastImageElement.src);
          this.imageUrls.delete(lastImageElement.src);
        }
        lastImage?.remove();
      }
    });

    // console.debug(`div[${divIndex + 1}/${divList.length}] ${imageIndex} - ${name}`);
  }

  #getDivIdx(divLength: number): number {
    if (0 === this.divIndexArray.length || divLength < this.divIndexArray.length) {
      this.divIndexArray = Array.from({ length: divLength }, (_, i) => i);
      this.divIndex = 0;
    }

    if (this.willRandom) {
      this.divIndex = RandomUtils.getRandomInt(0, this.divIndexArray.length);
    } else {
      if (this.divIndex >= this.divIndexArray.length) {
        this.divIndex = 0;
      }
    }

    return this.divIndexArray.splice(this.divIndex, 1)[0]!;
  }

  #getImageIdx(): number {
    if (this.imageIndexArray.length === 0) {
      this.imageIndexArray = Array.from({ length: this.imageLength }, (_, i) => i);
      this.imageIndex = RandomUtils.getRandomInt(0, this.imageIndexArray.length);
    }

    if (this.willRandom) {
      this.imageIndex = RandomUtils.getRandomInt(0, this.imageIndexArray.length);
    } else {
      if (this.imageIndex >= this.imageIndexArray.length) {
        this.imageIndex = 0;
      }
    }

    return this.imageIndexArray.splice(this.imageIndex, 1)[0]!;
  }
}

customElements.define('image-fall', ImageFall);
