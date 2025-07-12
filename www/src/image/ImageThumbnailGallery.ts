import { EventCode } from '@/GroundConstant';
import FlayFetch from '@lib/FlayFetch';
import StyleUtils from '@lib/StyleUtils';
import { addResizeListener } from '@lib/windowAddEventListener';

export class ImageThumbnailGallery extends HTMLElement {
  private static readonly ThumbnailDimensions = [3, 4];
  private static readonly ThumbnailScalingFactor = 5;

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
          perspective: 1000px;
          transform-style: preserve-3d;
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
          transform: scale(1) translateZ(0);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform-style: preserve-3d;
          backface-visibility: hidden;
          will-change: transform, opacity;
          contain: layout;
        }
        img.loaded {
          opacity: 1;
        }
        img:hover {
          transform: scale(1.2) translateZ(0);
          z-index: 1;
          transition: all 0.2s ease-out;
        }

        /* 자연스러운 페이드 애니메이션 */
        img.fading {
          animation: fade-transition 1.2s ease-in-out;
          will-change: opacity, transform;
        }

        @keyframes fade-transition {
          0% {
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
          20% {
            opacity: 0.8;
            transform: scale(1.01) translateZ(0);
          }
          50% {
            opacity: 0;
            transform: scale(1.02) translateZ(0);
          }
          80% {
            opacity: 0.8;
            transform: scale(1.01) translateZ(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
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
    // 컬럼별로 순차적으로 처리 (각 컬럼 내의 모든 행은 동시에)
    for (let col = 0; col < this.columnCount; col++) {
      const delayTime = col * 200; // 각 컬럼마다 200ms씩 지연

      setTimeout(() => {
        // 현재 컬럼의 모든 행을 동시에 처리
        for (let row = 0; row < this.rowCount; row++) {
          const imageIndex = row * this.columnCount + col;

          // 최대 썸네일 수를 초과하지 않도록 체크
          if (imageIndex >= this.maximumThumbnailCount) break;

          const img = this.shadowRoot!.querySelector(`#thumbnail-${imageIndex}`) as HTMLImageElement;
          const actualImageIndex = (this.currentImageIndex + imageIndex) % this.imageLength;

          // 이미지 로드 전 클래스 제거
          img.classList.remove('loaded');

          // 자연스러운 페이드 애니메이션 시작
          img.classList.add('fading');

          // 페이드 애니메이션 중간 지점에서 이미지 변경
          setTimeout(() => {
            img.src = FlayFetch.getImageURL(actualImageIndex);
            img.alt = `Image ${actualImageIndex}`;

            // 이미지 로드 완료 시 효과
            img.onload = () => {
              img.classList.add('loaded');
              // 페이드 애니메이션 완료 후 클래스 제거
              setTimeout(() => {
                img.classList.remove('fading');
              }, 600);
            };

            // 이미지 로드 실패 시에도 효과 적용
            img.onerror = () => {
              img.classList.add('loaded');
              setTimeout(() => {
                img.classList.remove('fading');
              }, 600);
            };
          }, 600); // 페이드 애니메이션의 50% 지점에서 이미지 변경 (1.2s의 50% = 600ms)
        }
      }, delayTime);
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
