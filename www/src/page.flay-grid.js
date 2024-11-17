import './init/Page';
import './page.flay-grid.scss';

import FlayArticle from './flay/FlayArticle';
import FlayCondition from './flay/page/FlayCondition';
import FlayCache from './lib/FlayCache';
import GridControl from './lib/GridControl';
import { addResizeListener } from './util/windowAddEventListener';

class Page {
  opusList = [];

  constructor() {}

  async #showCover(opus) {
    const flay = await FlayCache.getFlay(opus);
    const flayArticle = document.querySelector('main').appendChild(new FlayArticle({ mode: 'cover' }));
    flayArticle.set(flay);

    document.querySelector('#flayCount').innerHTML = this.opusList.length;

    return window.innerHeight > flayArticle.getBoundingClientRect().top;
  }

  async show() {
    let visible = true;
    do {
      const opus = this.opusList.shift();
      if (!opus) break;

      visible = await this.#showCover(opus);
    } while (visible);
  }

  async start() {
    const flayCondition = document.querySelector('body > header').appendChild(new FlayCondition());
    flayCondition.addEventListener('fetch', async () => {
      this.opusList = flayCondition.opusList;

      document.querySelector('#flayTotal').innerHTML = this.opusList.length;
      document.querySelector('main').textContent = null;
      await this.show();
    });

    document
      .querySelector('body > footer')
      .appendChild(new GridControl('main'))
      .addEventListener('change', () => this.show());

    window.addEventListener('scroll', () => {
      const isScrollAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
      if (isScrollAtBottom) {
        console.log('scroll at bottom');
        this.show();
      }
    });

    addResizeListener(() => this.show());
  }
}

new Page().start();
