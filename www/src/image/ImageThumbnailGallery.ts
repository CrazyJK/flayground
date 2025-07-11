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
          transition: transform 0.3s ease-in-out;
        }
        img:hover {
          transform: scale(1.2);
          z-index: 1;
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
    this.shadowRoot!.addEventListener('wheel', (event: WheelEvent) => {
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
  }

  private async renderGalleryThumbnails() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < this.totalImages; i++) {
      const img = fragment.appendChild(document.createElement('img'));
      img.src = FlayFetch.getImageURL(this.currentImageIndex);
      img.alt = `Image ${this.currentImageIndex}`;

      this.currentImageIndex = (this.currentImageIndex + 1) % this.imageLength;
    }
    this.shadowRoot!.querySelectorAll('img').forEach((img) => img.remove());
    this.shadowRoot!.appendChild(fragment);
  }
}

customElements.define('image-thumbnail-gallery', ImageThumbnailGallery);
