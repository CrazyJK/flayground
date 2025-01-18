import './PopoutCover.scss';

import { popupFlay } from '../../lib/FlaySearch';
import { OpusProvider } from '../../lib/OpusProvider';
import { getRandomInt } from '../../lib/randomNumber';

export default class PopoutCover extends HTMLDivElement {
  #타이머 = -1;
  #품번제공기;
  #최소초;
  #최대초;
  #나오기완료;

  /**
   *
   * @param {number} 최소초. 기본값 10초
   * @param {number} 최대초. 기본값 30초
   */
  constructor(최소초 = 10, 최대초 = 30) {
    super();

    this.classList.add('popout-cover', 'flay-div');

    this.#최소초 = 최소초;
    this.#최대초 = 최대초;
    this.#나오기완료 = true;
    this.#품번제공기 = new OpusProvider();
  }

  connectedCallback() {
    this.계속나오기();
  }

  disconnectedCallback() {
    clearTimeout(this.#타이머);
  }

  /**
   *
   * @param {Event} 이벤트
   */
  async 계속나오기(이벤트 = null) {
    await this.하나나오기(이벤트);
    this.#타이머 = setTimeout(async () => await this.계속나오기(), 1000 * getRandomInt(this.#최소초, this.#최대초));
  }

  /**
   *
   * @param {Event} 이벤트
   * @returns
   */
  async 하나나오기(이벤트 = null) {
    if (!this.#나오기완료) return;
    this.#나오기완료 = false;

    this.querySelectorAll('img').forEach((커버) => {
      커버.animate([{ transform: 'none' }, { transform: 'scale(0)' }], { duration: 400, iterations: 1 }).finished.then(() => {
        커버.remove();
      });
    });

    const 커버비율 = 269 / 400;
    const 여유공간 = 100;
    const { width: 판때기너비, height: 판때기높이 } = this.getBoundingClientRect();
    const 너비 = Math.min(1000, 판때기너비 / 2) + getRandomInt(0, 여유공간 * 2);
    const 높이 = 너비 * 커버비율;
    const 왼쪽 = 이벤트 ? 이벤트.x - 너비 / 2 : getRandomInt(여유공간, 판때기너비 - 너비 - 여유공간);
    const 위 = 이벤트 ? 이벤트.y - 높이 / 2 : getRandomInt(여유공간, 판때기높이 - 높이 - 여유공간);
    const 기울기각도 = getRandomInt(-10, 10);
    const 품번 = await this.#품번제공기.getRandomOpus();
    const 커버 = new Image();
    커버.style.cssText = `
      position: absolute;
      top: ${위}px;
      left: ${왼쪽}px;
      width: ${너비}px;
      height: auto;
      box-shadow: var(--box-shadow);
      border-radius: 0.25rem;
      transform: rotate(${기울기각도}deg);
      transition: 0.4s`;
    커버.src = `/static/cover/${품번}`;
    커버.onclick = () => popupFlay(품번);
    커버.onload = async () => {
      this.appendChild(커버);
      await 커버.animate(
        [
          { offset: 0.0, transform: 'scale(0)' },
          { offset: 0.5, transform: 'scale(1.1)' },
          { offset: 0.7, transform: 'scale(1.0)' },
          { offset: 0.8, transform: `rotate(${기울기각도 + 10}deg)` },
          { offset: 1.0, transform: `rotate(${기울기각도}deg)` },
        ],
        { duration: 800, iterations: 1 }
      ).finished;
      this.#나오기완료 = true;
    };
  }
}

customElements.define('popout-cover', PopoutCover, { extends: 'div' });
