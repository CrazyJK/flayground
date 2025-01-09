import './inc/Page';
import './page.flay-grid.scss';

import FlayArticle from '../flay/domain/FlayArticle';
import FlayCondition from '../flay/panel/FlayCondition';
import FlayFetch from '../lib/FlayFetch';
import GridControl from '../lib/GridControl';
import { getRandomInt } from '../lib/randomNumber';
import { addResizeListener } from '../lib/windowAddEventListener';

class Page {
  #opusList;

  constructor() {
    this.#opusList = [];
  }

  start() {
    document
      .querySelector('body > header')
      .appendChild(new FlayCondition())
      .addEventListener('fetch', async (e) => {
        this.#opusList = e.target.opusList;

        document.querySelector('#flayTotal').innerHTML = this.#opusList.length;
        document.querySelector('main').textContent = null;
        await this.#append();
      });

    document
      .querySelector('body > footer')
      .appendChild(new GridControl('main'))
      .addEventListener('change', () => this.#append());

    window.addEventListener('scroll', () => {
      const isScrollAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
      if (isScrollAtBottom) {
        console.log('scroll at bottom');
        this.#append();
      }
    });

    addResizeListener(() => this.#append());
  }

  async #append() {
    for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
      if (this.#opusList.length < 1) break;

      const lastArticleTop = document.querySelector('main > div:last-child')?.getBoundingClientRect().top || 0;
      if (lastArticleTop > window.innerHeight) break;

      const opus = Math.random() > 0.5 ? this.#opusList.shift() : this.#opusList.splice(getRandomInt(0, this.#opusList.length), 1)[0];
      document
        .querySelector('main')
        .appendChild(new FlayArticle({ mode: 'cover' }))
        .set(await FlayFetch.getFlay(opus));

      document.querySelector('#flayCount').innerHTML = this.#opusList.length;
    }
  }
}

new Page().start();
