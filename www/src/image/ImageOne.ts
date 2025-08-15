import FlayDiv from '@base/FlayDiv';
import { EventCode } from '@base/GroundConstant';
import { getDominatedColors } from '@lib/dominatedColor';
import FlayFetch from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import { Countdown, EVENT_COUNTDOWN_END } from '@ui/Countdown';
import './ImageOne.scss';
import './part/FlayImage';

// 이미지 정보 인터페이스
interface ImageInfo {
  idx: string;
  path: string;
  name: string;
  width: number;
  height: number;
}

const [RANDOM, FORWARD] = ['random', 'forward'];
const [ORIGINAL, FULLSIZE] = ['original', 'fullsize'];
const PLAY = 'play';
const TIMER = 10;

export class ImageOne extends FlayDiv {
  #flayImage: HTMLImageElement;
  #imgIdx: HTMLLabelElement;
  #imgPath: HTMLLabelElement;
  #imgName: HTMLLabelElement;
  #imgSize: HTMLLabelElement;
  #viewMode: HTMLButtonElement;
  #flowMode: HTMLButtonElement;
  #progressBar: HTMLDivElement;
  #countdown: Countdown;

  // 이벤트 핸들러들
  #drawInfoHandler: (e: Event) => void;
  #viewTogglerHandler: (e: MouseEvent) => void;
  #flowTogglerHandler: (e: MouseEvent) => void;
  #playTogglerHandler: (e: MouseEvent) => void;
  #onCountdownEndHandler: () => void;
  #playTogglerClickHandler: (e: MouseEvent) => void;
  #navigateOnWheelHandler: (e: WheelEvent) => void;
  #navigateOnKeyupHandler: (e: KeyboardEvent) => void;

  public imageIdx: number = 0;
  public imageSize: number = 0;

  constructor() {
    super();

    this.setAttribute('tabindex', '0'); // 포커스를 받을 수 있도록 tabindex 속성 추가
    this.innerHTML = `
      <flay-image></flay-image>
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

    this.#flayImage = this.querySelector('flay-image')!;
    this.#imgIdx = this.querySelector('#imgIdx')!;
    this.#imgPath = this.querySelector('#imgPath')!;
    this.#imgName = this.querySelector('#imgName')!;
    this.#imgSize = this.querySelector('#imgSize')!;
    this.#progressBar = this.querySelector('.progress-bar')!;
    this.#viewMode = this.querySelector('#viewMode')!;
    this.#flowMode = this.querySelector('#flowMode')!;
    this.#countdown = this.querySelector('.info')!.appendChild(new Countdown());

    // 이벤트 핸들러 바인딩
    this.#drawInfoHandler = (e: Event) => this.#drawInfo((e as CustomEvent).detail.info);
    this.#viewTogglerHandler = (e: MouseEvent) => this.#viewToggler(e);
    this.#flowTogglerHandler = (e: MouseEvent) => this.#flowToggler(e);
    this.#playTogglerHandler = (e: MouseEvent) => this.#playToggler(e, true);
    this.#onCountdownEndHandler = () => this.#onCountdownEnd();
    this.#playTogglerClickHandler = (e: MouseEvent) => this.#playToggler(e, false);
    this.#navigateOnWheelHandler = (e: WheelEvent) => this.#navigateOnWheel(e);
    this.#navigateOnKeyupHandler = (e: KeyboardEvent) => this.#navigateOnKeyup(e);

    // 이벤트 리스너 등록
    this.#flayImage.addEventListener('loaded', this.#drawInfoHandler);
    this.#viewMode.addEventListener('click', this.#viewTogglerHandler);
    this.#flowMode.addEventListener('click', this.#flowTogglerHandler);
    this.#countdown.addEventListener('click', this.#playTogglerHandler);
    this.#countdown.addEventListener(EVENT_COUNTDOWN_END, this.#onCountdownEndHandler);
    this.addEventListener('click', this.#playTogglerClickHandler);
    this.addEventListener('wheel', this.#navigateOnWheelHandler);
    this.addEventListener('keyup', this.#navigateOnKeyupHandler);
  }

  connectedCallback(): void {
    void FlayFetch.getImageSize().then((size: number) => {
      this.imageSize = size;
      this.#navigator('Space');
      this.#flowMode.click();
      this.#countdown.click();
    });
  }

  disconnectedCallback(): void {
    // 카운트다운 정리
    this.#countdown.reset();

    // 이벤트 리스너 제거
    this.#flayImage.removeEventListener('loaded', this.#drawInfoHandler);
    this.#viewMode.removeEventListener('click', this.#viewTogglerHandler);
    this.#flowMode.removeEventListener('click', this.#flowTogglerHandler);
    this.#countdown.removeEventListener('click', this.#playTogglerHandler);
    this.#countdown.removeEventListener(EVENT_COUNTDOWN_END, this.#onCountdownEndHandler);
    this.removeEventListener('click', this.#playTogglerClickHandler);
    this.removeEventListener('wheel', this.#navigateOnWheelHandler);
    this.removeEventListener('keyup', this.#navigateOnKeyupHandler);

    // CSS 변수 정리
    document.documentElement.style.removeProperty('--dominated-color');

    // 프로그레스 바 스타일 정리
    this.#progressBar.style.width = '';

    // 컴포넌트 상태 정리
    this.imageIdx = 0;
    this.imageSize = 0;

    // 이미지 데이터 정리
    if (this.#flayImage) {
      this.#flayImage.dataset.idx = '';
    }

    // 정보 표시 정리
    this.#imgIdx.textContent = '';
    this.#imgPath.textContent = '';
    this.#imgName.textContent = '';
    this.#imgSize.textContent = '';

    console.debug('[ImageOne] Component disconnected and cleaned up');
  }

  #navigateOnWheel(e: WheelEvent): void {
    this.#navigator(e.deltaY > 0 ? EventCode.WHEEL_DOWN : EventCode.WHEEL_UP);
  }

  #navigateOnKeyup(e: KeyboardEvent): void {
    this.#navigator(e.code);
  }

  #navigateByFlowMode(): void {
    this.#navigator(this.classList.contains(RANDOM) ? EventCode.SPACE : EventCode.ARROW_RIGHT);
  }

  #viewToggler(e: MouseEvent): void {
    e.stopPropagation();
    this.#viewMode.innerHTML = this.classList.toggle(FULLSIZE) ? FULLSIZE : ORIGINAL;
  }

  #flowToggler(e: MouseEvent): void {
    e.stopPropagation();
    this.#flowMode.innerHTML = this.classList.toggle(RANDOM) ? RANDOM : FORWARD;
  }

  #playToggler(e: MouseEvent, force?: boolean): void {
    e.stopPropagation();
    if (this.classList.toggle(PLAY, force)) {
      this.#countdown.start(TIMER);
    } else {
      this.#countdown.reset();
    }
  }

  #onCountdownEnd(): void {
    this.#navigateByFlowMode();
    this.#countdown.start(TIMER);
  }

  #navigator(code: string): void {
    switch (code) {
      case EventCode.SPACE:
        this.imageIdx = RandomUtils.getRandomInt(0, this.imageSize);
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

    this.#flayImage.dataset.idx = String(this.imageIdx);
    this.#progressBar.style.width = `${((this.imageIdx + 1) / this.imageSize) * 100}%`;
  }

  #drawInfo(info: ImageInfo): void {
    this.#imgIdx.textContent = info.idx;
    this.#imgPath.textContent = info.path;
    this.#imgName.textContent = info.name;
    this.#imgSize.textContent = `${info.width} x ${info.height}`;

    // dominated color
    void getDominatedColors(this.#flayImage, { scale: 0.5, offset: 16, limit: 1 }).then((colors) => {
      const rgba = colors.length > 0 ? colors[0]!.rgba : [255, 0, 0, 0.25];
      document.documentElement.style.setProperty('--dominated-color', `rgba(${rgba.join(',')})`);
    });
  }
}

customElements.define('image-one', ImageOne);
