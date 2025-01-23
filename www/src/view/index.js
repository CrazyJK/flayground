import './inc/Page';
import './index.scss';

import ModalWindow from '../ui/ModalWindow';

import { FlayBasket } from '../flay/panel/FlayBasket';
import FlayMemoEditor from '../flay/panel/FlayMemoEditor';
import FlayVideoViewPanel from '../flay/panel/FlayVideoViewPanel';
import PopoutCover from '../flay/panel/PopoutCover';
import ImageFall from '../image/ImageFall';
import { getRandomInt } from '../lib/randomNumber';

class Page {
  constructor() {}

  async start() {
    const [wUnit, hUnit] = [window.innerWidth / 12, window.innerHeight / 12];

    const main = document.querySelector('body > main');

    main
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

    main
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

    main
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

    main
      .appendChild(
        new ModalWindow('Cover', {
          top: getRandomInt(0, hUnit) + hUnit * 7,
          left: 0,
          width: getRandomInt(0, wUnit) + wUnit * 4,
          height: getRandomInt(0, hUnit) + hUnit * 2,
          edges: 'right',
        })
      )
      .appendChild(new PopoutCover());

    main
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
}

new Page().start();
