import { ColorFrequency, getDominatedColors } from '@lib/dominatedColor';
import FlayFetch, { ImageData } from '@lib/FlayFetch';
import './ImageFrame.scss';

export default class ImageFrame extends HTMLDivElement {
  img: HTMLImageElement;
  info: { idx: number; name: string; path: string; modified: Date; width: number; height: number; colors: ColorFrequency[] };

  constructor() {
    super();
    this.classList.add('image-frame', 'flay-div');
  }

  connectedCallback() {
    this.innerHTML = `
      <img>
      <div class="info">
        <label id="imgIdx"></label>
        <label id="imgName"></label>
      </div>
    `;

    this.img = this.querySelector('img');
  }

  async set(imageIdx: number): Promise<void> {
    const { name, path, modified, imageBlob }: ImageData = await FlayFetch.getStaticImage(imageIdx);

    URL.revokeObjectURL(this.img.src);
    this.img.src = URL.createObjectURL(imageBlob);
    await this.img.decode();

    const colors = await getDominatedColors(this.img, { scale: 0.2, offset: 16, limit: 5 });
    this.img.style.boxShadow = `0.25rem 0.5rem 2rem 0 rgba(${colors[0].rgba.join(',')})`;
    this.querySelector('#imgIdx').innerHTML = '#' + imageIdx;
    this.querySelector('#imgName').innerHTML = name;

    this.info = { idx: imageIdx, name: name, path: path, modified: modified, width: this.img.naturalWidth, height: this.img.naturalHeight, colors: colors };
    console.debug(imageIdx, 'info', this.info);
  }
}

customElements.define('image-frame', ImageFrame, { extends: 'div' });
