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
        }
      </style>
    `;
  }

  connectedCallback() {
    this.start();
  }

  private async start() {
    this.imageLength = await FlayFetch.getImageSize();

    this.initializeEventListeners();
    this.setupThumbnailGallery();

    this.random();
  }

  private initializeEventListeners() {
    addResizeListener(() => {
      this.currentImageIndex -= this.totalImages;
      this.setupThumbnailGallery();
      this.renderGalleryThumbnails();
    });

    this.shadowRoot!.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.previous();
      } else {
        this.next();
      }
    });

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      console.log(`Key pressed: ${event.key}`);
      if (event.key === 'ArrowLeft') {
        this.previous();
      } else if (event.key === 'ArrowRight') {
        this.next();
      } else if (event.key === ' ') {
        this.random();
      }
    });
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
      const imageData = await FlayFetch.getStaticImage(this.currentImageIndex);
      fragment.appendChild(document.createElement('img')).src = URL.createObjectURL(imageData.imageBlob);
      this.currentImageIndex = (this.currentImageIndex + 1) % this.imageLength;
    }
    this.shadowRoot!.querySelectorAll('img').forEach((img) => img.remove());
    this.shadowRoot!.appendChild(fragment);
  }
}

customElements.define('image-thumbnail-gallery', ImageThumbnailGallery);
