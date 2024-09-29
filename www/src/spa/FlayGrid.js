import FlayArticle from '../flay/FlayArticle';
import FlayCondition from '../flay/page/FlayCondition';
import GridControl from '../lib/GridControl';
import { OpusProvider } from '../lib/OpusProvider';

export default class FlayGrid extends OpusProvider {
  constructor() {
    super();

    this.classList.add('flay-grid');

    const flayCondition = this.appendChild(new FlayCondition());
    const flayContainer = this.appendChild(document.createElement('div'));
    const flayFooter = this.appendChild(document.createElement('div'));

    flayContainer.classList.add('flay-container');
    flayFooter.innerHTML = `<label><span id="flayCount">0</span> / <span id="flayTotal">0</span></label>`;

    flayCondition.addEventListener('fetch', async () => {
      this.opusList = flayCondition.opusList;

      document.querySelector('#flayTotal').innerHTML = this.opusList.length;
      flayContainer.textContent = null;

      await this.show();
    });

    flayFooter.appendChild(new GridControl('.flay-container')).addEventListener('change', () => this.show());

    window.addEventListener('scroll', () => {
      const isScrollAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
      if (isScrollAtBottom) {
        console.log('scroll at bottom');
        this.show();
      }
    });
  }

  async #showCover(opus) {
    const res = await fetch('/static/cover/' + opus + '/withData');
    const flay = JSON.parse(decodeURIComponent(res.headers.get('Data').replace(/\+/g, ' ')));
    const coverURL = URL.createObjectURL(await res.blob());

    const flayArticle = document.querySelector('.flay-container').appendChild(new FlayArticle({ mode: 'simple' }));
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
}

customElements.define('flay-grid', FlayGrid, { extends: 'div' });
