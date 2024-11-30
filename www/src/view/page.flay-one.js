import './inc/Page';
import './page.flay-one.scss';

import FlayArticle from '../flay/domain/FlayArticle';
import FlayCondition from '../flay/panel/FlayCondition';
import FlayFetch from '../lib/FlayFetch';
import { OpusProvider } from '../lib/OpusProvider';

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
      const flay = await FlayFetch.getFlay(opus);
      this.flayArticle.set(flay);
    }).finished;
  }
}

new Page().start();
