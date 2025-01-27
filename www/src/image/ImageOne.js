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
:host img {
  object-fit: contain;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}
:host footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
  background-image: linear-gradient(0, black, transparent);
  opacity: 0;
  transition: opacity 0.4s;
}
:host footer:hover {
  opacity: 1;
}
:host footer .info {
  display: flex;
  justify-content: center;
  gap: 0 1rem;
  background-color: transparent;
  padding: 0.25rem 1rem;
}
:host footer .info label {
  background-color: transparent;
  text-shadow: var(--text-shadow);
  font-size: var(--size-small);
  font-weight: 400;
  color: var(--color-white);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
:host footer .info label#imgIdx,
:host footer .info label#imgSize,
:host footer .info label#status {
  flex: 0 0 auto;
}

:host footer .progress {
  height: 1px;
}
:host footer .progress .progress-bar {
  background-color: #f00;
  height: 1px;
  transition: 0.4s;
}
`;

export default class ImageOne extends HTMLElement {
  #flayImage;
  #imgIdx;
  #imgPath;
  #imgName;
  #imgSize;
  #status;
  #progressBar;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.imageIdx = 0;
    this.imageSize = 0;
    this.playTimer = null;

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
          <label id="status"></label>
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
    this.#status = this.shadowRoot.querySelector('#status');
    this.#progressBar = this.shadowRoot.querySelector('.progress-bar');

    this.#flayImage.addEventListener('loaded', (e) => this.drawInfo(e.detail.info));
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

  onWheel(e) {
    this.navigator(e.wheelDelta > 0 ? 'WheelUp' : 'WheelDown');
  }

  onKeyup(e) {
    this.navigator(e.code);
  }

  onClick(e) {
    clearTimeout(this.playTimer);
    this.#status.innerHTML = '';
    if (e.ctrlKey || e.altKey) {
      this.#status.innerHTML = e.ctrlKey ? 'Forward' : 'Random';
      this.playTimer = setInterval(() => {
        this.navigator(e.ctrlKey ? 'WheelDown' : 'Space');
      }, 1000 * 10);
    }
  }

  async navigator(code) {
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
    await this.drawImage();
  }

  async drawImage() {
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
