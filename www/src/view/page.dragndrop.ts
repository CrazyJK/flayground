import FlayCard from '@flay/domain/FlayCard';
import * as DragDrop from '@lib/Drag&Drop';
import { FlayProvider } from '@lib/FlayProvider';
import RandomUtils from '@lib/RandomUtils';
import { addResizeListener } from '@lib/windowAddEventListener';
import './inc/Page';
import './page.dragndrop.scss';

class Page extends FlayProvider {
  constructor() {
    super();
  }

  async appendFlayCard() {
    const opus = await this.getRandomOpus();
    const flayCard = new FlayCard({ excludes: ['FlayComment', 'FlayFiles', 'FlayTag'] });
    flayCard.set(opus);

    const article = document.querySelector('body > article') as HTMLElement;
    const width = 400;
    const height = Math.round((width * 269) / 400);

    const left = RandomUtils.getRandomInt(0, article.offsetWidth - width);
    const top = RandomUtils.getRandomInt(0, article.offsetHeight - height);

    flayCard.style.position = 'absolute';
    flayCard.style.width = width + 'px';
    flayCard.style.left = left + 'px';
    flayCard.style.top = top + 'px';

    article.append(flayCard);

    DragDrop.setMoveable(flayCard);
  }

  removeFlayCard() {
    const flayCardList = document.querySelector('.movezone').querySelectorAll('.flay-card');
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
    addResizeListener(() => {
      this.fillDropzone();
    }, true);

    document.querySelector('.movezone').addEventListener('wheel', async () => {
      await this.appendFlayCard();
      this.removeFlayCard();
    });
  }
}

new Page().start();
