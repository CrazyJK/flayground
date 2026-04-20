import GroundFlay from '@base/GroundFlay';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import './FlayTooltip.scss';

export class FlayTooltip extends GroundFlay {
  #width: number = 300;
  #height: number = 200;

  #cover: HTMLImageElement;
  #title: HTMLDivElement;
  #actress: HTMLDivElement;
  #etc: HTMLDivElement;

  #prevOpus: string | null = null;

  constructor(width: number = 300) {
    super();

    this.#width = width;
    this.innerHTML = `
      <img src="" alt="" />
      <div class="info">
        <div class="title">title</div>
        <div class="actressList">actressList</div>
        <div class="etc">video.rank</div>
      </div>
    `;
    this.#cover = this.querySelector('img')!;
    this.#title = this.querySelector('.title')!;
    this.#actress = this.querySelector('.actressList')!;
    this.#etc = this.querySelector('.etc')!;
  }

  connectedCallback(): void {
    this.style.width = `${this.#width}px`;
    this.#height = this.offsetHeight;
  }

  disconnectedCallback(): void {
    FlayFetch.clearAll();
  }

  /**
   * Show the tooltip at the specified position.
   * @param flay
   * @param x
   * @param y
   */
  show(flay: Flay, x: number, y: number): void {
    if (this.#prevOpus !== null) FlayFetch.clear(this.#prevOpus);

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
        this.#cover.src = coverURL;
        this.#cover.alt = `${flay.opus} ${flay.title}`;
        this.#title.innerHTML = flay.title;
        this.#actress.innerHTML = flay.actressList.join(', ');
        this.#etc.innerHTML = `${flay.video.rank}R - ${flay.release} - ${flay.video.likes?.length || 0}S`;
        this.animate({ opacity: [0.1, 1] }, { duration: 300, fill: 'forwards' });
      })
      .then(() => {
        this.#prevOpus = flay.opus;
      })
      .catch((error) => {
        console.error('FlayTooltip: Error fetching cover URL:', error);
      });
  }

  hide(): void {
    this.animate({ opacity: [1, 0.1] }, { duration: 200, fill: 'forwards' }).onfinish = () => {
      this.classList.add('hide');
    };
  }
}

customElements.define('flay-tooltip', FlayTooltip);
