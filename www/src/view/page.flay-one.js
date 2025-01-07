import './inc/Page';
import './page.flay-one.scss';

import FlayArticle from '../flay/domain/FlayArticle';
import FlayCondition from '../flay/panel/FlayCondition';
import FlayFetch from '../lib/FlayFetch';
import { getRandomInt } from '../lib/randomNumber';

class Page {
  opusList;
  opusIndexes;

  async start() {
    const flayCondition = document.querySelector('body > main > header').appendChild(new FlayCondition());
    const flayArticle = document.querySelector('body > main > article').appendChild(new FlayArticle());

    flayCondition.addEventListener('fetch', async () => {
      this.opusList = flayCondition.opusList;
      this.opusIndexes = [];
      await this.#show(flayArticle);
    });

    window.addEventListener('wheel', async (e) => {
      if (e.deltaY > 0) await this.#show(flayArticle);
    });
  }

  /**
   *
   * @param {FlayArticle} flayArticle
   */
  async #show(flayArticle) {
    await document.startViewTransition(async () => {
      const opus = this.#getRandomOpus();
      const flay = await FlayFetch.getFlay(opus);
      flayArticle.set(flay);
    }).finished;
  }

  #getRandomOpus() {
    if (this.opusIndexes.length === 0) {
      this.opusIndexes.push(...Array.from({ length: this.opusList.length }, (v, i) => i));
    }
    const opusIndex = this.opusIndexes.splice(getRandomInt(0, this.opusIndexes.length), 1)[0];
    return this.opusList[opusIndex];
  }
}

new Page().start();
