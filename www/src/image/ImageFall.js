import { getRandomInt } from '../lib/randomNumber';
import { addResizeListener } from '../lib/windowAddEventListener';
import './ImageFall.scss';

const PANE_WIDTH = 360;

export default class ImageFall extends HTMLDivElement {
  contunue = true;
  willRandom = false;

  imageLength = -1;

  imageIndexArray = [];
  iamgeIndex = -1;

  divIndexArray = [];
  divIndex = -1;

  constructor() {
    super();
    this.classList.add('image-fall', 'flay-div');
  }

  connectedCallback() {
    addResizeListener(() => document.startViewTransition(() => this.#resizeDiv()));

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'Space':
          this.contunue = !this.contunue;
          break;
        case 'KeyR':
          this.willRandom = true;
          break;
        case 'KeyF':
          this.willRandom = false;
          break;
      }
    });

    fetch('/image/size')
      .then((res) => res.text())
      .then((text) => (this.imageLength = Number(text)))
      .then(() => this.#resizeDiv())
      .then(() => this.#render());
  }

  #resizeDiv() {
    const paneCount = Math.round(this.clientWidth / PANE_WIDTH);
    const imageWrapList = this.querySelectorAll('.row > div');

    this.textContent = null;
    for (let i = 0; i < paneCount; i++) {
      this.innerHTML += `<div class="row"></div>`;
    }

    const divList = this.querySelectorAll('.row');
    imageWrapList.forEach((imageWrap, index) => {
      divList[index % divList.length].append(imageWrap);
      imageWrap.style.height = 'auto';
    });
  }

  #render() {
    setInterval(() => {
      if (this.contunue) this.#addImage();
    }, 1000 * 3);
  }

  async #addImage() {
    const divList = this.querySelectorAll('.row');
    const divIndex = this.#getDivIdx(divList.length);
    const imageIndex = this.#getImageIdx();

    const imageWrap = document.createElement('div');
    divList[divIndex].prepend(imageWrap);

    const imageURL = '/static/image/' + imageIndex;
    const res = await fetch(imageURL);
    const idx = res.headers.get('Idx');
    const name = decodeURIComponent(res.headers.get('Name').replace(/\+/g, ' '));
    const path = decodeURIComponent(res.headers.get('Path').replace(/\+/g, ' '));

    const imageBlob = await res.blob();
    const image = new Image();
    image.src = URL.createObjectURL(imageBlob);
    image.title = `Idx: ${idx}\nName: ${name}\nPath: ${path}`;
    image.addEventListener('click', () => {
      // window.open(imageURL, 'image' + imageIndex, `width=${image.naturalWidth}px,height=${image.naturalHeight}px`);
      window.open(`popup.image.html?idx=${imageIndex}&max=${this.imageLength}`, `image${imageIndex}`, `width=${image.naturalWidth}px,height=${image.naturalHeight}px`);
    });
    imageWrap.append(image);

    await image.decode();
    imageWrap.style.height = `calc(${image.height}px + 1rem)`;
    imageWrap.style.top = 0;

    divList.forEach((div) => {
      const images = div.querySelectorAll('div');
      if (images.length > 9) {
        const lastImage = div.querySelector('div:last-child');
        URL.revokeObjectURL(lastImage.querySelector('img').src);
        lastImage.remove();
      }
    });

    // console.debug(`div[${divIndex + 1}/${divList.length}] ${imageIndex} - ${name}`);
  }

  #getDivIdx(divLength) {
    if (0 === this.divIndexArray.length || divLength < this.divIndexArray.length) {
      this.divIndexArray = Array.from({ length: divLength }, (v, i) => i);
      this.divIndex = 0;
    }

    if (this.willRandom) {
      this.divIndex = getRandomInt(0, this.divIndexArray.length);
    } else {
      if (this.divIndex >= this.divIndexArray.length) {
        this.divIndex = 0;
      }
    }

    return this.divIndexArray.splice(this.divIndex, 1)[0];
  }

  #getImageIdx() {
    if (this.imageIndexArray.length === 0) {
      this.imageIndexArray = Array.from({ length: this.imageLength }, (v, i) => i);
      this.iamgeIndex = getRandomInt(0, this.imageIndexArray.length);
    }

    if (this.willRandom) {
      this.iamgeIndex = getRandomInt(0, this.imageIndexArray.length);
    } else {
      if (this.iamgeIndex >= this.imageIndexArray.length) {
        this.currentIndex = 0;
      }
    }

    return this.imageIndexArray.splice(this.iamgeIndex, 1)[0];
  }
}

customElements.define('image-fall', ImageFall, { extends: 'div' });
