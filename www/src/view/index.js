import './inc/Page';
import './index.scss';

import ModalWindow from '../ui/ModalWindow';

import FlayVideoViewPanel from '../flay/panel/FlayVideoViewPanel';
import PopoutCover from '../flay/panel/PopoutCover';
import ImageFall from '../image/ImageFall';
import { getRandomInt } from '../lib/randomNumber';

class Page {
  constructor() {}

  async start() {
    const [wUnit, hUnit] = [window.innerWidth / 12, window.innerHeight / 12];

    const modalWindow1 = new ModalWindow('Today`s Flay', {
      top: 0,
      left: 0,
      width: getRandomInt(0, wUnit) + wUnit * 4,
      height: getRandomInt(0, hUnit) + hUnit * 4,
      edges: 'bottom,left',
    });
    const modalWindow2 = new ModalWindow('Image Fallen', {
      top: 0,
      left: 0,
      width: getRandomInt(0, wUnit) + wUnit,
      height: getRandomInt(0, hUnit) + hUnit * 10,
      edges: 'top,right',
    });
    const modalWindow3 = new ModalWindow('Video', {
      top: 0,
      left: 0,
      width: getRandomInt(0, wUnit) + wUnit * 6,
      height: getRandomInt(0, hUnit) + hUnit * 6,
      edges: 'top,left',
    });

    const main = document.querySelector('body > main');
    main.appendChild(modalWindow1).appendChild(new PopoutCover());
    main.appendChild(modalWindow2).appendChild(new ImageFall({ mode: 'random' }));
    main.appendChild(modalWindow3).appendChild(new FlayVideoViewPanel());

    main.addEventListener('FlayVideoViewPanel.play', (e) => (modalWindow3.windowTitle = e.detail.flay.title));
  }
}

new Page().start();
