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

  async connectedCallback() {
    this.imageLength = await FlayFetch.getImageSize();
    this.currentImageIndex = Math.floor(Math.random() * this.imageLength);

    this.initializeEventListeners();
    this.setupThumbnailGallery();
    this.renderGalleryThumbnails();
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
        this.currentImageIndex = (this.currentImageIndex - this.totalImages * 2) % this.imageLength;
      }
      this.renderGalleryThumbnails();
    });
  }

  private setupThumbnailGallery() {
    // Initialize the gallery thumbnails here
    this.columnCount = Math.floor(this.clientWidth / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailSize));
    this.rowCount = Math.floor(this.clientHeight / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailSize));
    this.totalImages = this.columnCount * this.rowCount;
    console.log(`Gallery initialized with ${this.columnCount} columns and ${this.rowCount} rows, total images: ${this.totalImages}`);
  }

  private async renderGalleryThumbnails() {
    console.log(`Rendering gallery with currentImageIndex: ${this.currentImageIndex}, totalImages: ${this.totalImages}`);

    // Clear previous content
    this.shadowRoot!.querySelectorAll('img').forEach((img) => img.remove());

    // Render the gallery thumbnails here
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < this.totalImages; i++) {
      const imageData = await FlayFetch.getStaticImage(this.currentImageIndex);
      // console.log(`Image data: ${JSON.stringify(imageData)}`);

      const imageUrl = URL.createObjectURL(imageData.imageBlob);
      // console.log(`Image URL: ${imageUrl}`);

      const imageElement = document.createElement('img');
      imageElement.src = imageUrl;
      // await imageElement.decode(); // Ensure the image is loaded before appending

      fragment.appendChild(imageElement);

      this.currentImageIndex = (this.currentImageIndex + 1) % this.imageLength;
    }
    this.shadowRoot!.appendChild(fragment);
  }
}

customElements.define('image-thumbnail-gallery', ImageThumbnailGallery);
