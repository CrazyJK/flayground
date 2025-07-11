import FlayFetch from '../lib/FlayFetch';
import StyleUtils from '../lib/StyleUtils';

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
    await this.setupEvents();
    await this.initializeGallery();
    await this.render();
  }

  private async setupEvents() {
    window.addEventListener('resize', () => {
      this.columnCount = Math.floor(this.clientWidth / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailSize));
      this.rowCount = Math.floor(this.clientHeight / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailSize));
      this.totalImages = this.columnCount * this.rowCount;
    });

    this.shadowRoot!.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.currentImageIndex = (this.currentImageIndex - this.totalImages * 2) % this.imageLength;
      }
      this.render();
    });
  }

  private async initializeGallery() {
    // Initialize the gallery thumbnails here
    this.imageLength = await FlayFetch.getImageSize();
    this.columnCount = Math.floor(this.clientWidth / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailSize));
    this.rowCount = Math.floor(this.clientHeight / StyleUtils.remToPx(ImageThumbnailGallery.ThumbnailSize));
    this.totalImages = this.columnCount * this.rowCount;
    this.currentImageIndex = Math.floor(Math.random() * this.imageLength);
  }

  private async render() {
    console.log(`Rendering ${this.totalImages} images with current index: ${this.currentImageIndex}`);

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
