import { getRandomInt } from '../lib/randomNumber';
import './part/FlayImage';

const cssText = `
:host {
  position: absolute;
  inset: 0;
  overflow: hidden;
  box-shadow: inset 0 0 4rem 0rem #000;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
:host(:hover) footer {
  opacity: 1;
}
:host(.full) img {
  width: 100%;
}

img {
  object-fit: contain;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  box-shadow: var(--box-shadow);
}

footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: linear-gradient(0, black, transparent);
  background-color: transparent;
  opacity: 0;
  transition: opacity 0.4s;
}

.info {
  display: flex;
  justify-content: space-between;
  gap: 0 0.5rem;
  padding: 0.25rem 1rem;
}
.info label,
.info button {
  background-color: transparent;
  border: 0;
  color: var(--color-white);
  text-shadow: var(--text-shadow);
  font-size: var(--size-small);
  font-weight: 400;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.info button {
  cursor: pointer;
}
.info #imgIdx,
.info #imgSize,
.info #viewMode,
.info #flowMode {
  flex: 0 0 auto;
}
.info #viewMode {
  margin-left: auto;
}

.progress {
  height: 1px;
}
.progress .progress-bar {
  background-color: #f00;
  height: 1px;
  transition: 0.4s;
}
`;

const [PAUSE, RANDOM, FORWARD] = ['Pause', 'Random', 'Forward'];
const [ORIGINAL, FULLSIZE] = ['Original', 'Fullsize'];
const TIMER = 10;

export class ImageOne extends HTMLElement {
  #flayImage;
  #imgIdx;
  #imgPath;
  #imgName;
  #imgSize;
  #viewMode;
  #flowMode;
  #progressBar;

  #willRandom = false;
  #willFullsize = false;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.imageIdx = 0;
    this.imageSize = 0;
    this.timer = null;

    this.setAttribute('tabindex', '0'); // 포커스를 받을 수 있도록 tabindex 속성 추가
    this.classList.add('image-one', 'flay-div');
    this.shadowRoot.innerHTML = `
      <style>${cssText}</style>
      <img is="flay-image">
      <footer>
        <div class="info">
          <label id="imgIdx"></label>
          <label id="imgPath"></label>
          <label id="imgName"></label>
          <label id="imgSize"></label>
          <button id="viewMode">${ORIGINAL}</button>
          <button id="flowMode">${PAUSE}</button>
        </div>
        <div class="progress">
          <div class="progress-bar"></div>
        </div>
      </footer>
    `;

    this.#flayImage = this.shadowRoot.querySelector('img');
    this.#imgIdx = this.shadowRoot.querySelector('#imgIdx');
    this.#imgPath = this.shadowRoot.querySelector('#imgPath');
    this.#imgName = this.shadowRoot.querySelector('#imgName');
    this.#imgSize = this.shadowRoot.querySelector('#imgSize');
    this.#progressBar = this.shadowRoot.querySelector('.progress-bar');
    this.#viewMode = this.shadowRoot.querySelector('#viewMode');
    this.#flowMode = this.shadowRoot.querySelector('#flowMode');

    this.#flayImage.addEventListener('loaded', (e) => this.drawInfo(e.detail.info));
    this.#viewMode.addEventListener('click', (e) => this.fullOrOriginal(e));
    this.#flowMode.addEventListener('click', (e) => this.randomOrForward(e));
    this.addEventListener('wheel', (e) => this.onWheel(e));
    this.addEventListener('click', (e) => this.onClick(e));
    this.addEventListener('keyup', (e) => this.onKeyup(e));
  }

  connectedCallback() {
    fetch('/image/size')
      .then((res) => res.text())
      .then((text) => {
        this.imageSize = Number(text);
        this.navigator('Space');
      });
  }

  disconnectedCallback() {
    clearInterval(this.timer);
  }

  onWheel(e) {
    this.navigator(e.wheelDelta > 0 ? 'WheelUp' : 'WheelDown');
  }

  onKeyup(e) {
    this.navigator(e.code);
  }

  onClick(e) {
    clearInterval(this.timer);
    this.#flowMode.innerHTML = PAUSE;
  }

  fullOrOriginal(e) {
    e.stopPropagation();
    this.#willFullsize = !this.#willFullsize;
    this.#viewMode.innerHTML = this.#willFullsize ? FULLSIZE : ORIGINAL;
    this.classList.toggle('full', this.#willFullsize);
  }

  randomOrForward(e) {
    e.stopPropagation();
    clearInterval(this.timer);

    this.#willRandom = !this.#willRandom;
    this.#flowMode.innerHTML = this.#willRandom ? RANDOM : FORWARD;

    this.timer = setInterval(() => {
      this.navigator(this.#willRandom ? 'Space' : 'WheelDown');
    }, 1000 * TIMER);
  }

  navigator(code) {
    switch (code) {
      case 'Space':
        this.imageIdx = getRandomInt(0, this.imageSize);
        break;
      case 'Home':
        this.imageIdx = 0;
        break;
      case 'End':
        this.imageIdx = this.imageSize - 1;
        break;
      case 'WheelUp':
      case 'ArrowUp':
      case 'ArrowLeft':
        this.imageIdx = this.imageIdx === 0 ? this.imageSize - 1 : this.imageIdx - 1;
        break;
      case 'WheelDown':
      case 'ArrowDown':
      case 'ArrowRight':
        this.imageIdx = this.imageIdx === this.imageSize - 1 ? 0 : this.imageIdx + 1;
        break;
    }
    this.drawImage();
  }

  drawImage() {
    this.#flayImage.dataset.idx = this.imageIdx;
    this.progressBar();
  }

  drawInfo(info) {
    this.#imgIdx.textContent = info.idx;
    this.#imgPath.textContent = info.path;
    this.#imgName.textContent = info.name;
    this.#imgSize.textContent = `${info.width} x ${info.height}`;
  }

  progressBar() {
    this.#progressBar.style.width = `${((this.imageIdx + 1) / this.imageSize) * 100}%`;
  }
}

customElements.define('image-one', ImageOne);
