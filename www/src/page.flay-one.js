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
    this.flayCondition = document.querySelector('header').appendChild(new FlayCondition());
    this.flayArticle = document.querySelector('article').appendChild(new FlayArticle());

    this.flayCondition.addEventListener('change', async () => {
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

new Page().start();
