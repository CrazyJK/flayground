import FlayStorage from '../util/FlayStorage';
import './FlayMonitor.scss';

const MonitorBackgroundColor = 'lightgray';
const FlayBackgroundColor = 'orange';
const FlayBorderColor = 'orangered';

const STORAGE_KEY = 'flay.position.info';

// 왼쪽부터 모니터 좌표
const Monitors = [
  { left: -2560, top: 71, right: -1, bottom: 1510, width: 2560, height: 1440 },
  { left: 0, top: 0, right: 1079, bottom: 1919, width: 1080, height: 1920 },
  { left: 1080, top: 60, right: 3639, bottom: 1499, width: 2560, height: 1440 },
  { left: 3640, top: -520, right: 5079, bottom: 2039, width: 1440, height: 2560 },
];

/**
 * 모니터에 창의 위치 모아 보기
 */
export default class FlayMonitor extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-monitor');

    // 0,0을 기준으로 상하좌우 제일 먼거
    this.left = Math.min(...Monitors.map((monitor) => monitor.left));
    this.top = Math.min(...Monitors.map((monitor) => monitor.top));
    this.right = Math.max(...Monitors.map((monitor) => monitor.right));
    this.bottom = Math.max(...Monitors.map((monitor) => monitor.bottom));
    this.width = this.right - this.left + 1;
    this.height = this.bottom - this.top + 1;

    console.log(`screen
      (${this.left}, ${this.top})
          ▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦
          ▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦  ${this.height}
          ▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦
                            ${this.width}                   (${this.right}, ${this.bottom})
    `);

    const canvas = this.appendChild(document.createElement('canvas'));
    canvas.width = this.width;
    canvas.height = this.height;
  }

  connectedCallback() {
    // initial draw
    this.#renderPosition(FlayStorage.local.getObject(STORAGE_KEY, '{}'));

    /** 클릭되면 fixed 클래스 추가 */
    // this.addEventListener('click', (e) => {
    //   e.stopPropagation();
    //   this.classList.toggle('fixed');
    // });

    /** 스토리지를 통해서 창들의 위치를 그린다 */
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      this.#renderPosition(JSON.parse(e.newValue));
    });
  }

  /**
   * 창들의 위치 그리기
   * @param {object} positionInfo
   */
  #renderPosition(positionInfo) {
    console.debug('renderPosition', positionInfo);
    this.#renderForeground();
    Object.entries(positionInfo).forEach(([key, position]) => this.#drawFlay(key, position));
    this.#removeBackground();
  }

  /** 모니터를 그린다 */
  #renderForeground() {
    const ctx = this.querySelector('canvas').getContext('2d');
    ctx.fillStyle = MonitorBackgroundColor;
    Monitors.forEach((monitor) => ctx.fillRect(this.#toX(monitor.left), this.#toY(monitor.top), monitor.width, monitor.height));
  }

  /** 모니터 밖의 영역을 지운다 */
  #removeBackground() {
    const ctx = this.querySelector('canvas').getContext('2d');
    Monitors.forEach((monitor) => {
      ctx.clearRect(this.#toX(monitor.left), this.#toY(this.top), monitor.width, monitor.top - this.top);
      ctx.clearRect(this.#toX(monitor.left), this.#toY(monitor.bottom), monitor.width, this.bottom - monitor.bottom);
    });
  }

  getImageURL() {
    return new Promise((resolve, reject) => {
      this.querySelector('canvas').toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/jpeg', 0.95);
    });
  }

  /**
   * storage clear, re-draw
   */
  clear() {
    // storage clear
    FlayStorage.local.setObject(STORAGE_KEY, {});
    this.#renderPosition({});
  }

  /**
   * @param {string} name
   * @param {object} position
   */
  #drawFlay(name, { left, top, width, height }) {
    const ctx = this.querySelector('canvas').getContext('2d');
    const lineWidth = 20;
    const margin = 30;
    const [x, y] = [this.#toX(left), this.#toY(top)];

    // 사각 바탕
    ctx.fillStyle = FlayBackgroundColor;
    ctx.fillRect(x + margin, y + margin, width - margin * 2, height - margin * 2);

    // 사각 보더
    ctx.strokeStyle = FlayBorderColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + margin, y + margin); // left top
    ctx.lineTo(x + width - margin, y + margin); // right top
    ctx.lineTo(x + width - margin, y + height - margin); // right bottom
    ctx.lineTo(x + margin, y + height - margin); // left bottom
    ctx.lineTo(x + margin, y + margin);
    ctx.stroke();

    // 이름 쓰기
    ctx.font = `bold ${16 * 8}px D2Coding`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + width / 2, y + height / 2, width - margin * 2);
  }

  #toX(left) {
    return left - this.left;
  }

  #toY(top) {
    return top - this.top;
  }
}

customElements.define('flay-monitor', FlayMonitor, { extends: 'div' });

/**
 * 위치 정보 업데이트
 * @param {string} name
 * @param {number} left
 * @param {number} top
 * @param {number} width
 * @param {number} height
 */
export const updatePosition = (name, left, top, width = 0, height) => {
  const positionInfo = FlayStorage.local.getObject(STORAGE_KEY, '{}');
  delete positionInfo[name];
  if (width > 0) {
    positionInfo[name] = { left: left, top: top, width: width, height: height };
  }
  FlayStorage.local.setObject(STORAGE_KEY, positionInfo);
};
