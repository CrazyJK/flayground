import './init/Page';
import './page.flay-one.scss';

import FlayArticle from './flay/FlayArticle';
import FlayCondition from './flay/page/FlayCondition';
import { OpusProvider } from './lib/OpusProvider';

class Page extends OpusProvider {
  constructor() {
    super();
  }

  async start() {
    this.flayCondition = document.querySelector('body > main > header').appendChild(new FlayCondition());
    this.flayArticle = document.querySelector('body > main > article').appendChild(new FlayArticle());

    this.flayCondition.addEventListener('fetch', async () => {
      this.setOpusList(this.flayCondition.opusList);
      await this.#show();
    });

    window.addEventListener('wheel', async (e) => {
      if (e.deltaY > 0) await this.#show();
    });
  }

  async #show() {
    await document.startViewTransition(async () => {
      const opus = await this.getRandomOpus();
      const flay = await fetch(`/flay/${opus}`).then((res) => res.json());
      this.flayArticle.set(flay);
    }).finished;
  }
}

new Page().start();
