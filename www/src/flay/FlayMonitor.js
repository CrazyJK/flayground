import './FlayMonitor.scss';

const MonitorBackgroundColor = 'lightgray';
const FlayBackgroundColor = 'orange';
const FlayBorderColor = 'orangered';

// 왼쪽부터 모니터 좌표
const Monitor1 = { left: -6200, top: -626, right: -3641, bottom: 814, width: 2560, height: 1440 };
const Monitor2 = { left: -3640, top: -713, right: -2561, bottom: 1207, width: 1080, height: 1920 };
const Monitor3 = { left: -2560, top: -360, right: -1, bottom: 1080, width: 2560, height: 1440 };
const Monitor4 = { left: 0, top: 0, right: 1920, bottom: 1032, width: 1920, height: 1032 };

export default class FlayMonitor extends HTMLElement {
  flayMap = new Map();

  static get observedAttributes() {
    return ['class'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug('attributeChangedCallback', name, oldValue, newValue);
    if (name === 'class') {
      oldValue?.split(' ').forEach((cssClass) => cssClass !== '' && this.shadowRoot.querySelector('.' + this.tagName.toLowerCase()).classList.remove(cssClass));
      newValue?.split(' ').forEach((cssClass) => cssClass !== '' && this.shadowRoot.querySelector('.' + this.tagName.toLowerCase()).classList.add(cssClass));
    }
  }

  constructor() {
    super();

    // 0,0을 기준으로 상하좌우 제일 먼거
    this.left = Math.min(Monitor1.left, Monitor2.left, Monitor3.left, Monitor4.left);
    this.top = Math.min(Monitor1.top, Monitor2.top, Monitor3.top, Monitor4.top);
    this.right = Math.max(Monitor1.right, Monitor2.right, Monitor3.right, Monitor4.right);
    this.bottom = Math.max(Monitor1.bottom, Monitor2.bottom, Monitor3.bottom, Monitor4.bottom);
    this.width = this.right - this.left;
    this.height = this.bottom - this.top;
    console.log(`screen
      (${this.left}, ${this.top})
          ▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦
          ▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦  ${this.height}
          ▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦▦
                            ${this.width}                   (${this.right}, ${this.bottom})
    `);
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());

    const canvas = wrapper.appendChild(document.createElement('canvas'));
    canvas.width = this.width;
    canvas.height = this.height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = MonitorBackgroundColor;
    ctx.fillRect(this.#toX(Monitor1.left), this.#toY(Monitor1.top), Monitor1.width, Monitor1.height);
    ctx.fillRect(this.#toX(Monitor2.left), this.#toY(Monitor2.top), Monitor2.width, Monitor2.height);
    ctx.fillRect(this.#toX(Monitor3.left), this.#toY(Monitor3.top), Monitor3.width, Monitor3.height);
    ctx.fillRect(this.#toX(Monitor4.left), this.#toY(Monitor4.top), Monitor4.width, Monitor4.height);

    this.#removeBackground();

    this.addEventListener('click', (e) => {
      e.stopPropagation();
      this.classList.toggle('fixed');
    });
  }

  #removeBackground() {
    const ctx = this.shadowRoot.querySelector('canvas').getContext('2d');
    const clearRect = (monitor) => {
      ctx.clearRect(this.#toX(monitor.left), this.#toY(this.top), monitor.width, monitor.top - this.top);
      ctx.clearRect(this.#toX(monitor.left), this.#toY(monitor.bottom), monitor.width, this.bottom - monitor.bottom);
    };

    clearRect(Monitor1);
    clearRect(Monitor2);
    clearRect(Monitor3);
    clearRect(Monitor4);
  }

  addFlay(name, left, top, width, height) {
    this.removeFlay(name);

    const rect = { left: Math.floor(left), top: Math.floor(top), w: Math.floor(width), h: Math.floor(height) };
    this.#addRect(name, rect);
    this.flayMap.set(name, rect);

    console.debug('addFlay', name, rect, this.flayMap);
  }

  removeFlay(name) {
    const rect = this.flayMap.get(name);
    if (rect) {
      this.#removeRect(rect);
      this.flayMap.delete(name);
    }
    console.debug('removeFlay', name);
  }

  #addRect(name, { left, top, w, h }) {
    const [x, y] = [this.#toX(left), this.#toY(top)];
    const lineWidth = 20;
    const margin = 30;
    const ctx = this.shadowRoot.querySelector('canvas').getContext('2d');
    console.debug('addRect', x, y, w, h);

    // 사각 바탕
    ctx.fillStyle = FlayBackgroundColor;
    ctx.fillRect(x + margin, y + margin, w - margin * 2, h - margin * 2);

    // 사각 보더
    ctx.strokeStyle = FlayBorderColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + margin, y + margin); // left top
    ctx.lineTo(x + w - margin, y + margin); // right top
    ctx.lineTo(x + w - margin, y + h - margin); // right bottom
    ctx.lineTo(x + margin, y + h - margin); // left bottom
    ctx.lineTo(x + margin, y + margin);
    ctx.stroke();

    // 이름 쓰기
    ctx.font = `bold ${16 * 8}px D2Coding`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + w / 2, y + h / 2, w);

    this.#removeBackground();
  }

  #removeRect({ left, top, w, h }) {
    const [x, y] = [this.#toX(left), this.#toY(top)];
    const ctx = this.shadowRoot.querySelector('canvas').getContext('2d');
    ctx.fillStyle = MonitorBackgroundColor;
    ctx.fillRect(x, y, w, h);

    this.#removeBackground();
  }

  #toX(left) {
    return left - this.left;
  }

  #toY(top) {
    return top - this.top;
  }
}

customElements.define('flay-monitor', FlayMonitor);
