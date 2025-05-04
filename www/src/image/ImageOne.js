import { EventCode } from '../GroundConstant';
import FlayFetch from '../lib/FlayFetch';
import { getRandomInt } from '../lib/randomNumber';
import { Countdown, EVENT_COUNTDOWN_END } from '../ui/Countdown';
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
:host(.fullsize) img {
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
  align-items: center;
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
.info button,
.info count-down {
  cursor: pointer;
  text-transform: capitalize;
}
.info #imgIdx,
.info #imgSize,
.info #viewMode,
.info #flowMode,
.info count-down {
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

const [RANDOM, FORWARD] = ['random', 'forward'];
const [ORIGINAL, FULLSIZE] = ['original', 'fullsize'];
const PLAY = 'play';
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
  #countdown;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.imageIdx = 0;
    this.imageSize = 0;

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
          <button id="flowMode">${FORWARD}</button>
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
    this.#countdown = this.shadowRoot.querySelector('.info').appendChild(new Countdown());

    this.#flayImage.addEventListener('loaded', (e) => this.#drawInfo(e.detail.info));

    this.#viewMode.addEventListener('click', (e) => this.#viewToggler(e));
    this.#flowMode.addEventListener('click', (e) => this.#flowToggler(e));
    this.#countdown.addEventListener('click', (e) => this.#playToggler(e));
    this.#countdown.addEventListener(EVENT_COUNTDOWN_END, () => this.#onCountdownEnd());

    this.addEventListener('click', (e) => this.#playToggler(e, false));
    this.addEventListener('wheel', (e) => this.#navigateOnWheel(e));
    this.addEventListener('keyup', (e) => this.#navigateOnKeyup(e));
  }

  connectedCallback() {
    FlayFetch.getImageSize().then((text) => {
      this.imageSize = Number(text);
      this.#navigator('Space');
    });
  }

  #navigateOnWheel(e) {
    this.#navigator(e.wheelDelta > 0 ? EventCode.WHEEL_UP : EventCode.WHEEL_DOWN);
  }

  #navigateOnKeyup(e) {
    this.#navigator(e.code);
  }

  #navigateByFlowMode() {
    this.#navigator(this.classList.contains(RANDOM) ? EventCode.SPACE : EventCode.ARROW_RIGHT);
  }

  #viewToggler(e) {
    e.stopPropagation();
    this.#viewMode.innerHTML = this.classList.toggle(FULLSIZE) ? FULLSIZE : ORIGINAL;
  }

  #flowToggler(e) {
    e.stopPropagation();
    this.#flowMode.innerHTML = this.classList.toggle(RANDOM) ? RANDOM : FORWARD;
  }

  #playToggler(e, force) {
    e.stopPropagation();
    if (this.classList.toggle(PLAY, force)) {
      this.#countdown.start(TIMER);
    } else {
      this.#countdown.reset();
    }
  }

  #onCountdownEnd() {
    this.#navigateByFlowMode();
    this.#countdown.start(TIMER);
  }

  #navigator(code) {
    switch (code) {
      case EventCode.SPACE:
        this.imageIdx = getRandomInt(0, this.imageSize);
        break;
      case EventCode.HOME:
        this.imageIdx = 0;
        break;
      case EventCode.END:
        this.imageIdx = this.imageSize - 1;
        break;
      case EventCode.WHEEL_UP:
      case EventCode.ARROW_UP:
      case EventCode.ARROW_LEFT:
        this.imageIdx = this.imageIdx === 0 ? this.imageSize - 1 : this.imageIdx - 1;
        break;
      case EventCode.WHEEL_DOWN:
      case EventCode.ARROW_DOWN:
      case EventCode.ARROW_RIGHT:
        this.imageIdx = this.imageIdx === this.imageSize - 1 ? 0 : this.imageIdx + 1;
        break;
    }

    this.#flayImage.dataset.idx = this.imageIdx;
    this.#progressBar.style.width = `${((this.imageIdx + 1) / this.imageSize) * 100}%`;
  }

  #drawInfo(info) {
    this.#imgIdx.textContent = info.idx;
    this.#imgPath.textContent = info.path;
    this.#imgName.textContent = info.name;
    this.#imgSize.textContent = `${info.width} x ${info.height}`;
  }
}

customElements.define('image-one', ImageOne);
