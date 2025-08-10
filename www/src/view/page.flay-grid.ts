import './inc/Page';
import './page.flay-grid.scss';

import FlayArticle from '@flay/domain/FlayArticle';
import FlayCondition from '@flay/panel/FlayCondition';
import FlayFetch from '@lib/FlayFetch';
import { addResizeListener } from '@lib/windowAddEventListener';
import GridControl from '@ui/GridControl';

class Page {
  #opusList: string[];

  constructor() {
    this.#opusList = [];
  }

  start() {
    document
      .querySelector('body > header')!
      .appendChild(new FlayCondition())
      .addEventListener('fetch', async (e) => {
        this.#opusList = (e.target as FlayCondition).opusList;

        document.querySelector('#flayTotal')!.innerHTML = String(this.#opusList.length);
        document.querySelector('main')!.textContent = null;
        await this.#append();
      });

    document
      .querySelector('body > footer')!
      .appendChild(new GridControl('main'))
      .addEventListener('change', () => this.#append());

    window.addEventListener('scroll', () => {
      const isScrollAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
      if (isScrollAtBottom) {
        console.log('scroll at bottom');
        void this.#append();
      }
    });

    addResizeListener(() => this.#append(), true);
  }

  async #append() {
    for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
      if (this.#opusList.length < 1) break;

      const lastArticleTop = document.querySelector('main > div:last-child')?.getBoundingClientRect().top ?? 0;
      if (lastArticleTop > window.innerHeight) break;

      const opus = this.#opusList.shift();
      const flay = await FlayFetch.getFlay(opus!);
      if (!flay) {
        console.warn(`Failed to fetch flay for opus: ${opus}`);
        continue;
      }
      document
        .querySelector('main')!
        .appendChild(new FlayArticle({ mode: 'cover' }))
        .set(flay);

      document.querySelector('#flayCount')!.innerHTML = String(this.#opusList.length);
    }
  }
}

new Page().start();
