import './init/Page';
import './page.dragndrop.scss';

import FlayCard from './flay/FlayCard';
import * as DragDrop from './lib/Drag&Drop';
import { FlayProvider } from './lib/FlayProvider';
import { getRandomInt } from './util/randomNumber';
import { addResizeLazyEventListener } from './util/resizeListener';

class Page extends FlayProvider {
  constructor() {
    super();
  }

  async appendFlayCard() {
    const opus = await this.getRandomOpus();
    const flayCard = new FlayCard({ excludes: ['FlayComment', 'FlayFiles', 'FlayTag'] });
    flayCard.set(opus);

    const article = document.querySelector('article');
    const width = 400;
    const height = parseInt((width * 269) / 400);

    const left = getRandomInt(0, article.offsetWidth - width);
    const top = getRandomInt(0, article.offsetHeight - height);

    flayCard.style.position = 'absolute';
    flayCard.style.width = width + 'px';
    flayCard.style.left = left + 'px';
    flayCard.style.top = top + 'px';

    article.append(flayCard);

    DragDrop.setMoveable(flayCard);
  }

  removeFlayCard() {
    const flayCardList = document.querySelector('.movezone').querySelectorAll('flay-card');
    for (let i = 0; i < flayCardList.length - 5; i++) {
      flayCardList[i].remove();
    }
  }

  fillDropzone() {
    const wrapper = document.querySelector('.dropzone-wrapper');

    const cardWidth = 350;
    const cardHeight = (cardWidth * 269) / 400;
    const columnCount = Math.floor(window.innerWidth / cardWidth);
    const rowCount = Math.floor(window.innerHeight / cardHeight);

    const end = columnCount * rowCount - wrapper.querySelectorAll('.dropzone').length;
    for (let i = 0; i < end; i++) {
      const dropzone = wrapper.appendChild(document.createElement('div'));
      dropzone.classList.add('dropzone');
      DragDrop.setDropzone(dropzone);
    }
  }

  async start() {
    addResizeLazyEventListener(() => {
      this.fillDropzone();
    });

    document.querySelector('.movezone').addEventListener('wheel', async () => {
      await this.appendFlayCard();
      this.removeFlayCard();
    });
  }
}

new Page().start();
