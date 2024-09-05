import './init/Page';
import './page.flay-grid.scss';

import FlayArticle from './flay/FlayArticle';
import FlayCondition from './flay/page/FlayCondition';
import GridControl from './lib/GridControl';
import { addResizeListener } from './util/windowAddEventListener';

class Page {
  opusList = [];

  constructor() {}

  async #showCover(opus) {
    const res = await fetch('/static/cover/' + opus + '/withData');
    const flay = JSON.parse(decodeURIComponent(res.headers.get('Data').replace(/\+/g, ' ')));
    const coverURL = URL.createObjectURL(await res.blob());

    const flayArticle = document.querySelector('main').appendChild(new FlayArticle({ mode: 'simple' }));
    flayArticle.set(flay, coverURL);

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
    flayCondition.addEventListener('change', async () => {
      this.opusList = flayCondition.opusList;

      document.querySelector('#flayTotal').innerHTML = this.opusList.length;
      document.querySelector('main').textContent = null;
      await this.show();
    });

    document
      .querySelector('footer')
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
