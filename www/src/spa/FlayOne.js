import FlayArticle from '../flay/FlayArticle';
import FlayCondition from '../flay/page/FlayCondition';
import { OpusProvider } from '../lib/OpusProvider';

export default class FlayOne extends OpusProvider {
  constructor() {
    super();

    this.classList.add('flay-one');

    this.flayCondition = this.appendChild(new FlayCondition());
    this.flayArticle = this.appendChild(new FlayArticle());

    this.flayCondition.addEventListener('fetch', async () => {
      this.setOpusList(this.flayCondition.opusList);
      this.#show();
    });

    window.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) this.#show();
    });
  }

  #show() {
    document.startViewTransition(async () => {
      const opus = await this.getRandomOpus();
      const flay = await fetch(`/flay/${opus}`).then((res) => res.json());
      this.flayArticle.set(flay);
    });
  }
}

customElements.define('flay-one', FlayOne, { extends: 'div' });
