import FlayFetch from '@lib/FlayFetch';
import { getRandomInt } from '@lib/randomNumber';
import { addResizeListener } from '@lib/windowAddEventListener';
import './ImageFall.scss';

const PANE_WIDTH = 360;
const DEFAULT_OPTS = { mode: 'serial', auto: true };

export class ImageFall extends HTMLDivElement {
  timer = -1;
  contunue = true;
  willRandom = false;

  imageLength = -1;

  imageIndexArray = [];
  iamgeIndex = -1;

  divIndexArray = [];
  divIndex = -1;

  // 이벤트 리스너와 리소스 정리를 위한 변수들
  keyupHandler = null;
  removeResizeListener = null;
  imageUrls = new Set(); // 생성된 이미지 URL들을 추적

  constructor(opts = DEFAULT_OPTS) {
    super();
    this.classList.add('image-fall', 'flay-div');

    const { mode, auto } = { ...DEFAULT_OPTS, ...opts };
    this.contunue = auto;
    this.willRandom = mode === 'random';
  }

  connectedCallback() {
    this.removeResizeListener = addResizeListener(() => this.#resizeDiv(), true);

    this.keyupHandler = (e) => {
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
    };
    window.addEventListener('keyup', this.keyupHandler);

    FlayFetch.getImageSize()
      .then((text) => (this.imageLength = Number(text)))
      .then(() => this.#resizeDiv())
      .then(() => this.#render());
  }

  disconnectedCallback() {
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
    this.imageUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.imageUrls.clear();

    // 기존 이미지들의 URL 정리
    this.querySelectorAll('img').forEach((img) => {
      if (img.src && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });

    // 상태 초기화
    this.contunue = false;
    this.imageLength = -1;
    this.imageIndexArray = [];
    this.iamgeIndex = -1;
    this.divIndexArray = [];
    this.divIndex = -1;

    // DOM 정리
    this.innerHTML = '';

    console.debug('[ImageFall] Component disconnected and cleaned up');
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
      divList[index % divList.length]?.append(imageWrap);
      imageWrap.style.height = 'auto';
    });
  }

  #render() {
    this.timer = setInterval(() => {
      if (this.contunue) this.#addImage();
    }, 1000 * 3);
  }

  async #addImage() {
    const divList = this.querySelectorAll('.row');
    const divIndex = this.#getDivIdx(divList.length);
    const imageIndex = this.#getImageIdx();

    const imageWrap = document.createElement('div');
    divList[divIndex].prepend(imageWrap);

    const { name, path, modified, imageBlob } = await FlayFetch.getStaticImage(imageIndex);

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
    imageWrap.style.top = 0;

    divList.forEach((div) => {
      const images = div.querySelectorAll('div');
      if (images.length > 9) {
        const lastImage = div.querySelector('div:last-child');
        const lastImageElement = lastImage.querySelector('img');
        if (lastImageElement && lastImageElement.src) {
          URL.revokeObjectURL(lastImageElement.src);
          this.imageUrls.delete(lastImageElement.src);
        }
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
