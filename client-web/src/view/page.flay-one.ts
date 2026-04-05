import FlayArticle from '@flay/domain/FlayArticle';
import FlayCondition from '@flay/panel/FlayCondition';
import FlayFetch from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import './inc/Page';
import './page.flay-one.scss';

class Page {
  opusList!: string[];
  opusIndexes!: number[];

  start() {
    const flayCondition = document.querySelector('body > main > header')!.appendChild(new FlayCondition());
    const flayArticle = document.querySelector('body > main > article')!.appendChild(new FlayArticle({}));

    flayCondition.addEventListener('fetch', () => {
      this.opusList = flayCondition.opusList;
      this.opusIndexes = [];
      void this.#show(flayArticle);
    });

    window.addEventListener('wheel', (e: WheelEvent) => {
      if (e.deltaY > 0) void this.#show(flayArticle);
    });
  }

  /**
   *
   * @param flayArticle
   */
  async #show(flayArticle: FlayArticle) {
    await document.startViewTransition(async () => {
      const opus = this.#getRandomOpus();
      const flay = await FlayFetch.getFlay(opus!);
      if (!flay) {
        console.warn(`Failed to fetch flay for opus: ${opus}`);
        return;
      }
      flayArticle.set(flay);
    }).finished;
  }

  #getRandomOpus() {
    if (this.opusIndexes.length === 0) {
      this.opusIndexes.push(...Array.from({ length: this.opusList.length }, (_, i) => i));
    }
    const opusIndex = this.opusIndexes.splice(RandomUtils.getRandomInt(0, this.opusIndexes.length), 1)[0];
    return this.opusList[opusIndex!];
  }
}

new Page().start();
