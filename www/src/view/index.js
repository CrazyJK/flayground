import './inc/Page';
import './index.scss';

import { ModalShadowWindow } from '../ui/ModalShadowWindow';
import { ModalWindow } from '../ui/ModalWindow';

import { MODAL_EDGE, MODAL_MODE } from '../GroundConstant';
import { getRandomInt } from '../lib/randomNumber';

class Page {
  constructor() {}

  async start() {
    const [wUnit, hUnit] = [window.innerWidth / 12, window.innerHeight / 12];

    document.querySelector('body > footer').appendChild(newHTMLButtonElement('button', 'Video', () => this.#videoWindow(wUnit, hUnit)));
    document.querySelector('body > footer').appendChild(newHTMLButtonElement('button', 'Basket', () => this.#basketWindow(wUnit, hUnit)));
    document.querySelector('body > footer').appendChild(newHTMLButtonElement('button', 'Memo', () => this.#memoWindow(wUnit, hUnit)));
    document.querySelector('body > footer').appendChild(newHTMLButtonElement('button', 'ImageFall', () => this.#imageFallWindow(wUnit, hUnit)));
    document.querySelector('body > footer').appendChild(newHTMLButtonElement('button', 'ImageOne', () => this.#imageOneWindow(wUnit, hUnit)));
    document.querySelector('body > footer').appendChild(newHTMLButtonElement('button', 'Borwser', () => this.#browserWindow(wUnit, hUnit)));
  }

  #videoWindow(wUnit, hUnit) {
    import(/* webpackChunkName: "FlayVideoViewPanel" */ '../flay/panel/FlayVideoViewPanel').then(({ FlayVideoViewPanel }) => {
      document
        .querySelector('body > main')
        .appendChild(
          new ModalWindow('Video', {
            top: 0,
            left: 0,
            width: getRandomInt(0, wUnit) + wUnit * 6,
            height: getRandomInt(0, hUnit) + hUnit * 7,
            edges: [MODAL_EDGE.TOP, MODAL_EDGE.LEFT],
          })
        )
        .appendChild(new FlayVideoViewPanel());
    });
  }

  #basketWindow(wUnit, hUnit) {
    import(/* webpackChunkName: "FlayBasket" */ '../flay/panel/FlayBasket').then(({ FlayBasket }) => {
      document
        .querySelector('body > main')
        .appendChild(
          new ModalWindow('Basket', {
            top: 0,
            left: 0,
            width: getRandomInt(0, wUnit) + wUnit * 4,
            height: getRandomInt(0, hUnit) + hUnit * 3,
            edges: [MODAL_EDGE.BOTTOM, MODAL_EDGE.LEFT],
          })
        )
        .appendChild(new FlayBasket());
    });
  }

  #memoWindow(wUnit, hUnit) {
    import(/* webpackChunkName: "FlayMemoEditor" */ '../flay/panel/FlayMemoEditor').then(({ FlayMemoEditor }) => {
      document
        .querySelector('body > main')
        .appendChild(
          new ModalWindow('Memo', {
            top: 0,
            left: 0,
            width: getRandomInt(0, wUnit) + wUnit * 1,
            height: getRandomInt(0, hUnit) + hUnit * 2,
            edges: [MODAL_EDGE.BOTTOM, MODAL_EDGE.RIGHT],
          })
        )
        .appendChild(new FlayMemoEditor());
    });
  }

  #imageFallWindow(wUnit, hUnit) {
    import(/* webpackChunkName: "ImageFall" */ '../flay/panel/ImageFall').then(({ ImageFall }) => {
      document
        .querySelector('body > main')
        .appendChild(
          new ModalWindow('Image Fallen', {
            top: 0,
            left: 0,
            width: getRandomInt(0, wUnit) + wUnit * 1,
            height: getRandomInt(0, hUnit) + hUnit * 8,
            edges: [MODAL_EDGE.TOP, MODAL_EDGE.RIGHT],
          })
        )
        .appendChild(new ImageFall({ mode: 'random' }));
    });
  }

  #imageOneWindow(wUnit, hUnit) {
    import(/* webpackChunkName: "ImageOne" */ '../image/ImageOne').then(({ ImageOne }) => {
      document
        .querySelector('body > main')
        .appendChild(
          new ModalShadowWindow('Image One', {
            top: 0,
            left: 0,
            width: getRandomInt(0, wUnit) + wUnit * 8,
            height: getRandomInt(0, hUnit) + hUnit * 6,
            edges: [MODAL_EDGE.TOP, MODAL_EDGE.RIGHT],
          })
        )
        .appendChild(new ImageOne({ mode: 'random' }));
    });
  }

  #browserWindow(wUnit, hUnit) {
    import(/* webpackChunkName: "BrowserPanel" */ '../flay/panel/BrowserPanel').then(({ BrowserPanel }) => {
      document
        .querySelector('body > main')
        .appendChild(
          new ModalShadowWindow('Browser Panel', {
            top: 0,
            left: getRandomInt(0, wUnit) + wUnit * 6,
            width: 730,
            height: 1326,
            initialMode: MODAL_MODE.NORMAL,
            edges: [MODAL_EDGE.TOP],
          })
        )
        .appendChild(new BrowserPanel());
    });
  }
}

new Page().start();

function newHTMLButtonElement(type, text, callback) {
  const button = document.createElement('button');
  button.textContent = text;
  button.type = type;
  button.addEventListener('click', callback);
  return button;
}
