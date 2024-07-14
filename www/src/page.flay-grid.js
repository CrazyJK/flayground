import './init/Page';
import './page.flay-grid.scss';

import FlayArticle from './flay/FlayArticle';
import FlayCondition from './flay/page/FlayCondition';

class Page {
  opusList = [];

  constructor() {}

  async #showCover(opus) {
    const res = await fetch('/static/cover/' + opus + '/withData');
    const data = res.headers.get('Data');
    const dataDecoded = decodeURIComponent(data.replace(/\+/g, ' '));
    const flay = JSON.parse(dataDecoded);

    const coverBlob = await res.blob();
    const coverURL = URL.createObjectURL(coverBlob);

    const flayArticle = document.querySelector('main').appendChild(new FlayArticle({ card: true }));
    flayArticle.set(flay, coverURL);
  }

  async show() {
    for (let i = 0; i < 16; i++) {
      const opus = this.opusList.shift();
      if (!opus) break;
      await this.#showCover(opus);
    }
  }

  async start() {
    const flayCondition = document.querySelector('body > header').appendChild(new FlayCondition());
    flayCondition.addEventListener('change', async () => {
      this.opusList = flayCondition.opusList;

      document.querySelector('main').textContent = null;
      await this.show();
    });

    window.addEventListener('scroll', () => {
      const isScrollAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
      if (isScrollAtBottom) {
        console.log('scroll at bottom');
        this.show();
      }
    });
  }
}

new Page().start();
