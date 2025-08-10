import ApiClient from '@lib/ApiClient';
import { popupFlay } from '@lib/FlaySearch';
import { OpusProvider } from '@lib/OpusProvider';
import RandomUtils from '@lib/RandomUtils';
import { Countdown, EVENT_COUNTDOWN_END, EVENT_COUNTDOWN_START } from '@ui/Countdown';

export default class CoverPopout extends HTMLElement {
  #품번제공기;
  #최소초;
  #최대초;

  countdown: Countdown;

  /**
   *
   * @param {number} 최소초. 기본값 10초
   * @param {number} 최대초. 기본값 30초
   */
  constructor(최소초 = 10, 최대초 = 30) {
    super();

    this.#최소초 = 최소초;
    this.#최대초 = 최대초;
    this.#품번제공기 = new OpusProvider();

    this.classList.add('cover-popout', 'flay-div');
    this.style.cssText = `position: relative; width: 100%; height: 100%; overflow: hidden;`;

    this.countdown = this.appendChild(new Countdown());
    this.countdown.style.cssText = `position: absolute; right: 0; bottom: 0;`;
    this.countdown.addEventListener(EVENT_COUNTDOWN_START, async () => await this.하나나오기());
    this.countdown.addEventListener(EVENT_COUNTDOWN_END, () => this.countdown.start(RandomUtils.getRandomInt(this.#최소초, this.#최대초)));
  }

  connectedCallback() {
    this.countdown.start(RandomUtils.getRandomInt(this.#최소초, this.#최대초));
  }

  /**
   *
   * @param {Event} 이벤트
   * @returns
   */
  async 하나나오기(이벤트 = null) {
    this.querySelectorAll('img').forEach((커버) => {
      커버.animate([{ transform: 'none' }, { transform: 'scale(0)' }], { duration: 400, iterations: 1 })
        .finished.then(() => {
          커버.remove();
        })
        .catch((error) => {
          console.error('Error animating cover:', error);
        });
    });

    const 커버비율 = 269 / 400;
    const 여유공간 = 100;
    const { width: 판때기너비, height: 판때기높이 } = this.parentElement!.getBoundingClientRect();
    const 너비 = Math.min(1000, 판때기너비 / 2) + RandomUtils.getRandomInt(0, 여유공간 * 2);
    const 높이 = 너비 * 커버비율;
    const 왼쪽 = 이벤트 ? 이벤트['x'] - 너비 / 2 : RandomUtils.getRandomInt(여유공간, 판때기너비 - 너비 - 여유공간);
    const 위 = 이벤트 ? 이벤트['y'] - 높이 / 2 : RandomUtils.getRandomInt(여유공간, 판때기높이 - 높이 - 여유공간);
    const 기울기각도 = RandomUtils.getRandomInt(-10, 10);
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
    커버.src = ApiClient.buildUrl(`/static/cover/${품번}`);
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
    };
  }
}

customElements.define('cover-popout', CoverPopout);
