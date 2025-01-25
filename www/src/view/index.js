import './inc/Page';
import './index.scss';

import ModalWindow from '../ui/ModalWindow';

import BrowserPanel from '../flay/panel/BrowserPanel';
import { FlayBasket } from '../flay/panel/FlayBasket';
import FlayMemoEditor from '../flay/panel/FlayMemoEditor';
import FlayVideoViewPanel from '../flay/panel/FlayVideoViewPanel';
import ImageFall from '../image/ImageFall';
import { getRandomInt } from '../lib/randomNumber';
import ModalShadowWindow from '../ui/ModalShadowWindow';

class Page {
  constructor() {}

  async start() {
    const [wUnit, hUnit] = [window.innerWidth / 12, window.innerHeight / 12];

    this.#videoWindow(wUnit, hUnit);
    this.#basketWindow(wUnit, hUnit);
    this.#memoWindow(wUnit, hUnit);
    this.#imageWindow(wUnit, hUnit);
    this.#browserWindow(wUnit, hUnit);
  }

  #videoWindow(wUnit, hUnit) {
    document
      .querySelector('body > main')
      .appendChild(
        new ModalWindow('Video', {
          top: 0,
          left: 0,
          width: getRandomInt(0, wUnit) + wUnit * 8,
          height: getRandomInt(0, hUnit) + hUnit * 4,
          edges: 'top,left',
        })
      )
      .appendChild(new FlayVideoViewPanel());
  }

  #basketWindow(wUnit, hUnit) {
    document
      .querySelector('body > main')
      .appendChild(
        new ModalWindow('Basket', {
          top: 0,
          left: 0,
          width: getRandomInt(0, wUnit) + wUnit * 8,
          height: getRandomInt(0, hUnit) + hUnit * 6,
          edges: 'bottom,left',
        })
      )
      .appendChild(new FlayBasket());
  }

  #memoWindow(wUnit, hUnit) {
    document
      .querySelector('body > main')
      .appendChild(
        new ModalWindow('Memo', {
          top: 0,
          left: 0,
          width: getRandomInt(0, wUnit) + wUnit * 4,
          height: getRandomInt(0, hUnit) + hUnit * 2,
          edges: 'bottom,right',
        })
      )
      .appendChild(new FlayMemoEditor());
  }

  #imageWindow(wUnit, hUnit) {
    document
      .querySelector('body > main')
      .appendChild(
        new ModalWindow('Image Fallen', {
          top: 0,
          left: 0,
          width: getRandomInt(0, wUnit) + wUnit * 2,
          height: getRandomInt(0, hUnit) + hUnit * 7,
          edges: 'top,right',
        })
      )
      .appendChild(new ImageFall({ mode: 'random' }));
  }

  #browserWindow(wUnit, hUnit) {
    document
      .querySelector('body > main')
      .appendChild(
        new ModalShadowWindow('Browser Panel', {
          top: getRandomInt(0, hUnit) + hUnit * 6,
          left: getRandomInt(0, wUnit) + wUnit * 2,
          width: getRandomInt(0, wUnit) + wUnit * 6,
          height: getRandomInt(0, hUnit) + hUnit * 4,
          edges: 'center',
        })
      )
      .appendChild(new BrowserPanel());
  }
}

new Page().start();
