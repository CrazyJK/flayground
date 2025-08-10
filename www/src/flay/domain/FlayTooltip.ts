import FlayFetch, { Flay } from '@lib/FlayFetch';
import './FlayTooltip.scss';

export class FlayTooltip extends HTMLElement {
  #width: number = 300;
  #height: number = 200;

  constructor(width: number = 300) {
    super();
    this.#width = width;
  }

  connectedCallback(): void {
    this.style.width = `${this.#width}px`;
    this.innerHTML = `
      <img src="" alt="" />
      <div class="info">
        <div class="title">title</div>
        <div class="actressList">actressList</div>
        <div class="rank">video.rank</div>
      </div>
    `;
    this.#height = this.offsetHeight;
  }

  disconnectedCallback(): void {}

  show(flay: Flay, x: number, y: number): void {
    let [left, top] = [x, y];
    // 화면 오른쪽에 넘치면, 왼쪽으로 이동
    if (x + this.#width > window.innerWidth) {
      left = Math.max(0, x - this.#width);
    }
    // 화면 아래쪽에 넘치면, 위쪽으로 이동
    if (y + this.#height > window.innerHeight) {
      top = Math.max(0, y - this.#height);
    }
    FlayFetch.getCoverURL(flay.opus)
      .then((coverURL) => {
        this.classList.remove('hide');
        this.style.left = `${left}px`;
        this.style.top = `${top}px`;
        this.querySelector('img')!.src = coverURL;
        this.querySelector('img')!.alt = flay.title;
        this.querySelector('.title')!.textContent = flay.title;
        this.querySelector('.actressList')!.textContent = flay.actressList.join(', ');
        this.querySelector('.rank')!.textContent = `${flay.video.rank}R - ${flay.release}`;
      })
      .catch((error) => {
        console.error('FlayTooltip: Error fetching cover URL:', error);
      });
  }

  hide(): void {
    this.classList.add('hide');
  }
}

customElements.define('flay-tooltip', FlayTooltip);
