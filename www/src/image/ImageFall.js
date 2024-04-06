import { getRandomInt } from '../util/randomNumber';
import { addResizeLazyEventListener } from '../util/resizeListener';
import './ImageFall.scss';

const PANE_WIDTH = 360;

export default class ImageFall extends HTMLElement {
  contunue = true;
  imageLength = -1;
  imageIndexArray = [];
  divIndexArray = [];

  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const main = this.shadowRoot.appendChild(document.createElement('main'));
    main.classList.add(this.tagName.toLowerCase());

    addResizeLazyEventListener(() => {
      document.startViewTransition(() => {
        this.resizeDiv();
      });
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.contunue = !this.contunue;
      }
    });

    fetch('/image/size')
      .then((res) => res.text())
      .then((text) => (this.imageLength = Number(text)))
      .then(() => this.resizeDiv())
      .then(() => this.render());
  }

  resizeDiv() {
    const main = this.shadowRoot.querySelector('main');
    let paneCount = Math.round(main.clientWidth / PANE_WIDTH);
    this.divIndexArray = Array.from({ length: paneCount }, (v, i) => i);
    console.debug('resizeDiv', main.clientWidth, main.clientHeight, paneCount);

    let imageList = this.shadowRoot.querySelectorAll('main > div > div');
    console.debug('resizeDiv imageList', imageList.length);

    main.textContent = null;
    for (let i = 0; i < paneCount; i++) {
      main.innerHTML += `<div></div>`;
    }

    let divList = this.shadowRoot.querySelectorAll('main > div');
    imageList.forEach((img, index) => {
      divList[index % divList.length].append(img);
      img.style.height = 'auto';
    });
  }

  render() {
    setInterval(() => {
      if (this.contunue) {
        // document.startViewTransition(() => {
        this.addImage();
        // });
      }
    }, 1000 * 3);
  }

  async addImage() {
    let divList = this.shadowRoot.querySelectorAll('main > div');
    let divIndex = this.getDivIdx(divList.length);
    let imageIndex = this.getImageIdx();
    let div = divList[divIndex];

    let innerDiv = document.createElement('div');
    div.prepend(innerDiv);

    const res = await fetch('/static/image/' + imageIndex);
    let idx = res.headers.get('Idx');
    let name = decodeURIComponent(res.headers.get('Name').replace(/\+/g, ' '));
    let path = decodeURIComponent(res.headers.get('Path').replace(/\+/g, ' '));

    const myBlob = await res.blob();
    let image = new Image();
    image.src = URL.createObjectURL(myBlob);
    image.title = `Idx: ${idx}\nName: ${name}\nPath: ${path}`;
    innerDiv.append(image);

    await image.decode();
    innerDiv.style.height = `calc(${image.height}px + 1rem)`;
    innerDiv.style.top = 0;

    divList.forEach((div, idx) => {
      let images = div.querySelectorAll('div');
      let lastImage = div.querySelector('div:last-child');
      if (images.length > 9) {
        lastImage.remove();
      }
      console.debug('div', idx, 'images', images.length);
    });

    console.debug(`addImage idx: ${imageIndex} at div[${divIndex}] of ${divList.length}`);
  }

  getDivIdx(divLength) {
    if (this.divIndexArray.length === 0) {
      this.divIndexArray = Array.from({ length: divLength }, (v, i) => i);
      console.debug('getDivIdx reset', this.divIndexArray);
    }

    let randomIndex = getRandomInt(0, this.divIndexArray.length);
    let pickedIndex = this.divIndexArray.splice(randomIndex, 1);
    console.debug('getDivIdx', this.divIndexArray.length, randomIndex, pickedIndex);

    return pickedIndex[0];
  }

  getImageIdx() {
    if (this.imageIndexArray.length === 0) {
      this.imageIndexArray = Array.from({ length: this.imageLength }, (v, i) => i);
      console.debug('getImageIdx reset', this.imageIndexArray);
    }

    let randomIndex = getRandomInt(0, this.imageIndexArray.length);
    let pickedIndex = this.imageIndexArray.splice(randomIndex, 1);
    console.debug('getImageIdx', this.imageIndexArray.length, randomIndex, pickedIndex);

    return pickedIndex[0];
  }
}

customElements.define('image-fall', ImageFall);
