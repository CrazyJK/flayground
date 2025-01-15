import './inc/Page';
import './index.scss';

import ImageFall from '../image/ImageFall';
import DraggableWindow from '../lib/DraggableWindow';
import { getRandomInt } from '../lib/randomNumber';

class Page {
  constructor() {}

  async start() {
    import(/* webpackChunkName: "PopoutCover" */ '../flay/panel/PopoutCover').then((module) =>
      new module.default(
        document
          .querySelector('body > main')
          .appendChild(
            new DraggableWindow('Today`s Flay', {
              top: 0,
              left: 0,
              width: getRandomInt(window.innerWidth / 2, (window.innerWidth * 4) / 5),
              height: getRandomInt(window.innerHeight / 2, (window.innerHeight * 4) / 5),
              edges: 'bottom,left',
            })
          )
          .getBodyPanel()
      ).계속나오기()
    );

    document
      .querySelector('body > main')
      .appendChild(
        new DraggableWindow('Image Fallen', {
          top: 0,
          left: 0,
          width: 500,
          height: getRandomInt(window.innerHeight / 2, (window.innerHeight * 4) / 5),
          edges: 'top,right',
        })
      )
      .addContent(new ImageFall({ mode: 'random' }));
  }
}

new Page().start();
