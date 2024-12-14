import { popupFlay } from '../../lib/FlaySearch';
import { OpusProvider } from '../../lib/OpusProvider';
import { getRandomInt } from '../../lib/randomNumber';

export default class 커버튀어나오기 extends OpusProvider {
  #판때기;
  #최소초;
  #최대초;
  #나오기완료;
  #원래크기_키프레임;
  #크기0_키프레임;
  #애니메이션옵션;

  constructor(판때기, 최소초 = 10, 최대초 = 30) {
    super();

    this.#판때기 = 판때기;
    this.#최소초 = 최소초;
    this.#최대초 = 최대초;
    this.#나오기완료 = true;
    this.#원래크기_키프레임 = { transform: 'none' };
    this.#크기0_키프레임 = { transform: 'scale(0)' };
    this.#애니메이션옵션 = { duration: 500, iterations: 1 };
  }

  async 계속나오기(이벤트) {
    await this.하나나오기(이벤트);
    setTimeout(async () => await this.계속나오기(), 1000 * getRandomInt(this.#최소초, this.#최대초));
  }

  async 하나나오기(이벤트) {
    if (!this.#나오기완료) return;
    this.#나오기완료 = false;

    this.#판때기.querySelectorAll('img').forEach((커버) => {
      커버.animate([this.#원래크기_키프레임, this.#크기0_키프레임], this.#애니메이션옵션).finished.then(() => {
        커버.remove();
      });
    });

    const 여유공간 = 100;
    const { width: 판때기너비, height: 판때기높이 } = this.#판때기.getBoundingClientRect();
    const 너비 = Math.min(1200, 판때기너비 / 2);
    const 높이 = 너비 * (269 / 400);
    const 왼쪽 = 이벤트 ? 이벤트.x - 너비 / 2 : getRandomInt(여유공간, 판때기너비 - 너비 - 여유공간);
    const 위 = 이벤트 ? 이벤트.y - 높이 / 2 : getRandomInt(여유공간, 판때기높이 - 높이 - 여유공간);

    const 품번 = await this.getRandomOpus();
    const 커버 = new Image();
    커버.style.cssText = `
      position: absolute;
      left: ${왼쪽}px;
      top: ${위}px;
      width: ${너비}px;
      height: auto;
      box-shadow: var(--box-shadow);
      border-radius: 0.25rem;`;
    커버.src = `/static/cover/${품번}`;
    커버.onclick = () => popupFlay(품번);
    커버.onload = () => {
      this.#판때기.appendChild(커버);
      커버.animate([this.#크기0_키프레임, this.#원래크기_키프레임], this.#애니메이션옵션).finished.then(() => {
        this.#나오기완료 = true;
      });
    };
  }
}
