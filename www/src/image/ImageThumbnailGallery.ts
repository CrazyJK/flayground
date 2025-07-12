import { EventCode } from '@/GroundConstant';
import FlayFetch from '@lib/FlayFetch';
import StyleUtils from '@lib/StyleUtils';
import { addResizeListener } from '@lib/windowAddEventListener';

export class ImageThumbnailGallery extends HTMLElement {
  private static readonly ThumbnailDimensions = [3, 4];
  private static readonly ThumbnailScalingFactor = 4;

  private static readonly ThumbnailWidth = ImageThumbnailGallery.ThumbnailDimensions[0] * ImageThumbnailGallery.ThumbnailScalingFactor; // in rem
  private static readonly ThumbnailHeight = ImageThumbnailGallery.ThumbnailDimensions[1] * ImageThumbnailGallery.ThumbnailScalingFactor; // in rem

  private imageLength: number = 0;
  private columnCount: number = 0;
  private rowCount: number = 0;
  private maximumThumbnailCount: number = 0;
  private currentImageIndex: number = 0;
  private keydownListener: (event: KeyboardEvent) => void;
  private removeResizeListener: () => void;
  private slideshowInterval: number | null = null;
  private isSlideshowActive: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-content: space-around;
          justify-content: space-around;
        }
        img {
          width: ${ImageThumbnailGallery.ThumbnailWidth}rem;
          height: ${ImageThumbnailGallery.ThumbnailHeight}rem;
          object-fit: cover;
          clip-path: inset(0.5rem round 10%);
          display: inline-block;
          margin: 0;
          padding: 0;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        img.loaded {
          opacity: 1;
          transform: scale(1);
        }
        img:hover {
          transform: scale(1.2);
          z-index: 1;
          transition: all 0.2s ease-out;
        }
      </style>
    `;
  }

  connectedCallback() {
    this.start();
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.keydownListener);
    this.removeResizeListener();
    this.stopSlideshow();
  }

  private async start() {
    this.imageLength = await FlayFetch.getImageSize();
    this.initializeEventListeners();
    this.setupThumbnailGallery();
    this.random();
  }

  private initializeEventListeners() {
    this.removeResizeListener = addResizeListener(() => {
      this.setupThumbnailGallery();
      this.renderGalleryThumbnails();
    });

    this.parentElement!.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();

      // 휠 이벤트가 발생하면 슬라이드쇼를 중지
      if (this.isSlideshowActive) {
        this.stopSlideshow();
      }

      event.deltaY < 0 ? this.previous() : this.next();
    });

    this.keydownListener = (event: KeyboardEvent) => {
      console.debug(`Key pressed: ${event.key} ${event.code}`);

      // 슬라이드쇼가 진행 중일 때는 아무 키나 누르면 정지
      if (this.isSlideshowActive) {
        this.stopSlideshow();
        if (event.code === EventCode.SPACE) {
          return;
        }
      }

      switch (event.code) {
        case EventCode.ARROW_LEFT:
          this.previous();
          break;
        case EventCode.ARROW_RIGHT:
          this.next();
          break;
        case EventCode.KEY_R:
          this.random();
          break;
        case EventCode.SPACE:
          this.startSlideshow();
          break;
      }
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  private next() {
    this.currentImageIndex = (this.currentImageIndex + this.maximumThumbnailCount) % this.imageLength;
    this.renderGalleryThumbnails();
  }

  private previous() {
    this.currentImageIndex = (this.currentImageIndex - this.maximumThumbnailCount) % this.imageLength;
    this.renderGalleryThumbnails();
  }

  private random() {
    this.currentImageIndex = Math.floor(Math.random() * this.imageLength);
    this.renderGalleryThumbnails();
  }

  private setupThumbnailGallery() {
    this.columnCount = Math.floor(this.clientWidth / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailWidth));
    this.rowCount = Math.floor(this.clientHeight / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailHeight));
    this.maximumThumbnailCount = this.columnCount * this.rowCount;

    this.shadowRoot!.querySelectorAll('img').forEach((img) => img.remove());
    for (let i = 0; i < this.maximumThumbnailCount; i++) {
      const img = this.shadowRoot!.appendChild(document.createElement('img'));
      img.id = `thumbnail-${i}`;
    }
  }

  private async renderGalleryThumbnails() {
    // 모든 이미지를 먼저 페이드 아웃
    this.shadowRoot!.querySelectorAll('img').forEach((img) => img.classList.remove('loaded'));

    // 짧은 지연 후 새 이미지들을 순차적으로 로드
    await new Promise((resolve) => setTimeout(resolve, 150));

    for (let i = 0; i < this.maximumThumbnailCount; i++) {
      const img = this.shadowRoot!.querySelector(`#thumbnail-${i}`) as HTMLImageElement;
      const imageIndex = (this.currentImageIndex + i) % this.imageLength;

      // 이미지 로드 전에 약간의 지연을 추가하여 순차적 효과 생성
      setTimeout(() => {
        img.src = FlayFetch.getImageURL(imageIndex);
        img.alt = `Image ${imageIndex}`;

        // 이미지 로드 완료 시 페이드 인 효과
        img.onload = () => {
          img.classList.add('loaded');
        };

        // 이미지 로드 실패 시에도 페이드 인 (빈 이미지라도 보이도록)
        img.onerror = () => {
          img.classList.add('loaded');
        };
      }, i * 50); // 각 이미지마다 50ms씩 지연
    }
  }

  private startSlideshow() {
    if (this.isSlideshowActive) return;

    this.isSlideshowActive = true;
    console.debug('Slideshow started');

    const nextSlide = () => {
      if (!this.isSlideshowActive) return;

      this.next();

      // 다음 슬라이드를 위한 랜덤 간격 설정 (10-20초)
      const randomInterval = Math.random() * 10000 + 10000; // 10000ms ~ 20000ms
      this.slideshowInterval = window.setTimeout(nextSlide, randomInterval);
    };

    // 첫 번째 슬라이드 시작
    nextSlide();
  }

  private stopSlideshow() {
    if (!this.isSlideshowActive) return;

    this.isSlideshowActive = false;

    if (this.slideshowInterval) {
      window.clearTimeout(this.slideshowInterval);
      this.slideshowInterval = null;
    }

    console.debug('Slideshow stopped');
  }
}

customElements.define('image-thumbnail-gallery', ImageThumbnailGallery);
