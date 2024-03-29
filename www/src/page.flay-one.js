import './init/Page';
import './page.flay-one.scss';

import { getRandomInt } from './util/randomNumber';

class Page {
  opusList;
  opusIndexes;
  condition;
  coverContainer;
  coverURL;

  constructor() {
    this.opusList = [];
    this.opusIndexes = [];
    this.condition = { rank: [0, 1, 2, 3, 4, 5] };
    this.coverContainer = document.querySelector('body > main');
  }

  #getRandomOpus() {
    if (this.opusIndexes.length === 0) this.opusIndexes.push(...Array.from({ length: this.opusList.length }, (v, i) => i));
    return this.opusList[this.opusIndexes.splice(getRandomInt(0, this.opusIndexes.length), 1)[0]];
  }

  #showCover() {
    URL.revokeObjectURL(this.coverURL);
    document.startViewTransition(async () => {
      this.opus = this.#getRandomOpus();
      this.coverURL = URL.createObjectURL(await fetch(`/static/cover/${this.opus}`).then((res) => res.blob()));
      this.coverContainer.style.backgroundImage = `url(${this.coverURL})`;
    });
  }

  async start() {
    this.opusList = await fetch('/flay/list/opus', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.condition),
    }).then((res) => res.json());

    this.#showCover();

    this.coverContainer.addEventListener('click', () => {
      window.open('popup.flay.html?opus=' + this.opus, 'popup.' + this.opus, 'width=800px,height=1280px');
    });
    window.addEventListener('wheel', () => this.#showCover());
  }
}

new Page().start();
