import FlayFetch from '@lib/FlayFetch';
import StyleUtils from '@lib/StyleUtils';
import { addResizeListener } from '@lib/windowAddEventListener';

export class ImageThumbnailGallery extends HTMLElement {
  private static readonly ThumbnailSize = 18; // in rem
  private imageLength: number = 0;
  private columnCount: number = 0;
  private rowCount: number = 0;
  private totalImages: number = 0;
  private currentImageIndex: number = 0;
  private keydownListener: (event: KeyboardEvent) => void;
  private removeResizeListener: () => void;

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
          width: ${ImageThumbnailGallery.ThumbnailSize}rem;
          height: ${ImageThumbnailGallery.ThumbnailSize}rem;
          object-fit: cover;
          aspect-ratio: 1/1;
          clip-path: circle(50%);
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
  }

  private async start() {
    this.imageLength = await FlayFetch.getImageSize();

    this.initializeEventListeners();
    this.setupThumbnailGallery();

    this.random();
  }

  private initializeEventListeners() {
    this.parentElement!.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.previous();
      } else {
        this.next();
      }
    });

    this.removeResizeListener = addResizeListener(() => {
      this.currentImageIndex -= this.totalImages;
      this.setupThumbnailGallery();
      this.renderGalleryThumbnails();
    });

    this.keydownListener = (event: KeyboardEvent) => {
      console.log(`Key pressed: ${event.key}`);
      if (event.key === 'ArrowLeft') {
        this.previous();
      } else if (event.key === 'ArrowRight') {
        this.next();
      } else if (event.key === ' ') {
        this.random();
      }
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  private next() {
    this.renderGalleryThumbnails();
  }

  private previous() {
    this.currentImageIndex = (this.currentImageIndex - this.totalImages * 2) % this.imageLength;
    this.renderGalleryThumbnails();
  }

  private random() {
    this.currentImageIndex = Math.floor(Math.random() * this.imageLength);
    this.renderGalleryThumbnails();
  }

  private setupThumbnailGallery() {
    this.columnCount = Math.floor(this.clientWidth / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailSize));
    this.rowCount = Math.floor(this.clientHeight / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailSize));
    this.totalImages = this.columnCount * this.rowCount;

    this.shadowRoot!.querySelectorAll('img').forEach((img) => img.remove());
    for (let i = 0; i < this.totalImages; i++) {
      const img = this.shadowRoot!.appendChild(document.createElement('img'));
      img.id = `thumbnail-${i}`;
    }
  }

  private async renderGalleryThumbnails() {
    // 모든 이미지를 먼저 페이드 아웃
    const images = this.shadowRoot!.querySelectorAll('img');
    images.forEach((img) => {
      img.classList.remove('loaded');
      // 인라인 스타일 초기화
      img.style.removeProperty('opacity');
      img.style.removeProperty('transform');
    });

    // 짧은 지연 후 새 이미지들을 순차적으로 로드
    await new Promise((resolve) => setTimeout(resolve, 150));

    for (let i = 0; i < this.totalImages; i++) {
      const img = this.shadowRoot!.querySelector(`#thumbnail-${i}`) as HTMLImageElement;

      // 이미지 로드 전에 약간의 지연을 추가하여 순차적 효과 생성
      setTimeout(() => {
        img.src = FlayFetch.getImageURL(this.currentImageIndex + i);
        img.alt = `Image ${this.currentImageIndex + i}`;

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

    // 인덱스 업데이트
    this.currentImageIndex = (this.currentImageIndex + this.totalImages) % this.imageLength;
  }
}

customElements.define('image-thumbnail-gallery', ImageThumbnailGallery);
