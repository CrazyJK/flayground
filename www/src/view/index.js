import './inc/Page';
import './index.scss';

import ModalWindow from '../ui/ModalWindow';

import FlayVideoViewPanel from '../flay/panel/FlayVideoViewPanel';
import ImageFall from '../image/ImageFall';
import { getRandomInt } from '../lib/randomNumber';

class Page {
  constructor() {}

  async start() {
    const [wUnit, hUnit] = [window.innerWidth / 12, window.innerHeight / 12];

    import(/* webpackChunkName: "PopoutCover" */ '../flay/panel/PopoutCover').then((module) =>
      new module.default(
        document
          .querySelector('body > main')
          .appendChild(
            new ModalWindow('Today`s Flay', {
              top: 0,
              left: 0,
              width: getRandomInt(0, wUnit) + wUnit * 4,
              height: getRandomInt(0, hUnit) + hUnit * 4,
              edges: 'bottom,left',
            })
          )
          .getBodyPanel()
      ).계속나오기()
    );

    document
      .querySelector('body > main')
      .appendChild(
        new ModalWindow('Image Fallen', {
          top: 0,
          left: 0,
          width: getRandomInt(0, wUnit) + wUnit,
          height: getRandomInt(0, hUnit) + hUnit * 10,
          edges: 'top,right',
        })
      )
      .addContent(new ImageFall({ mode: 'random' }));

    document
      .querySelector('body > main')
      .appendChild(
        new ModalWindow('Video', {
          top: 0,
          left: 0,
          width: getRandomInt(0, wUnit) + wUnit * 6,
          height: getRandomInt(0, hUnit) + hUnit * 6,
          edges: 'top,left',
        })
      )
      .addContent(new FlayVideoViewPanel())
      .start();
  }
}

new Page().start();
