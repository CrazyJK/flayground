import './init/Page';
import './page.flay-one.scss';

import { OpusProvider } from './lib/OpusProvider';

class Page extends OpusProvider {
  opus;
  coverURL;
  coverContainer;

  constructor() {
    super();

    this.coverContainer = document.querySelector('body > main');
  }

  #showCover() {
    URL.revokeObjectURL(this.coverURL);
    document.startViewTransition(async () => {
      this.opus = await this.getRandomOpus();
      this.coverURL = URL.createObjectURL(await fetch(`/static/cover/${this.opus}`).then((res) => res.blob()));
      this.coverContainer.style.backgroundImage = `url(${this.coverURL})`;
    });
  }

  async start() {
    this.#showCover();

    this.coverContainer.addEventListener('click', () => {
      window.open('popup.flay.html?opus=' + this.opus, 'popup.' + this.opus, 'width=800px,height=1280px');
    });
    window.addEventListener('wheel', () => this.#showCover());
  }
}

new Page().start();
