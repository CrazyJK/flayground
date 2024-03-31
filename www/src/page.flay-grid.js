import './init/Page';
import './page.flay-grid.scss';

import FlayCondition from './flay/page/FlayCondition';
import { OpusProvider } from './lib/OpusProvider';
import SVG from './svg/svg.json';

class Page extends OpusProvider {
  constructor() {
    super();
  }

  async #showCover() {
    const opus = await this.getRandomOpus();

    const res = await fetch('/static/cover/' + opus + '/withData');
    const data = res.headers.get('Data');
    const dataDecoded = decodeURIComponent(data.replace(/\+/g, ' '));
    const flay = JSON.parse(dataDecoded);

    const coverBlob = await res.blob();
    const coverURL = URL.createObjectURL(coverBlob);

    document.querySelector('main').appendChild(document.createElement('div')).innerHTML = `
      <div style="background-image: url(${coverURL})">
        <label>
          ${SVG.rank[flay.video.rank + 1]}
          <a data-opus="${flay.opus}">${flay.title}</a>
        </label>
      </div>
    `;
  }

  async show() {
    for (let i = 0; i < 16; i++) {
      await this.#showCover();
    }
  }

  async start() {
    const flayCondition = document.querySelector('body > header').appendChild(new FlayCondition());
    flayCondition.addEventListener('change', async (e) => {
      this.setOpusList(e.detail.list);
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

    document.addEventListener('click', (e) => {
      const opus = e.target.dataset.opus;
      if (opus) {
        window.open('popup.flay.html?opus=' + opus, 'popup.' + opus, 'width=800px,height=1280px');
      }
    });
  }
}

new Page().start();
