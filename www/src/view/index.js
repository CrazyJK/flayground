import './inc/Page';
import './index.scss';

import ImageFall from '../image/ImageFall';
import DraggableWindow from '../lib/DraggableWindow';

class Page {
  constructor() {}

  async start() {
    import(/* webpackChunkName: "PopoutCover" */ '../flay/panel/PopoutCover').then((module) =>
      new module.default(
        document
          .querySelector('body > main')
          .appendChild(
            new DraggableWindow('추천 Flay', {
              top: 920,
              left: 40,
              width: 800,
              height: 800,
              edges: 'bottom,left',
            })
          )
          .getBodyPanel()
      ).계속나오기()
    );

    document
      .querySelector('body > main')
      .appendChild(
        new DraggableWindow('이미지 추천', {
          top: 10,
          left: 460,
          width: 400,
          height: 800,
          edges: 'top,right',
        })
      )
      .addContent(new ImageFall({ mode: 'random' }));
  }
}

new Page().start();
