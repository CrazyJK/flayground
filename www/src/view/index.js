import { ImageCircle } from '@/image/ImageCircle';
import DateUtils from '@lib/DateUtils';
import './inc/Page';
import './index.scss';

class Page {
  #mainElement;

  constructor() {
    this.#mainElement = document.querySelector('body > main');
  }

  async start() {
    this.#mainElement.addEventListener('click', () => this.#showMarkerPanel(), { once: true });

    const imageCircle = document.body.appendChild(new ImageCircle(10));
    imageCircle.style.position = 'fixed';
    imageCircle.style.right = 0;
    imageCircle.style.bottom = 0;
  }

  #showMarkerPanel() {
    this.#mainElement.textContent = null;

    // 랜덤 boolean
    const randomBoolean = Math.random() < 0.5;
    if (randomBoolean) {
      import(/* webpackChunkName: "FlayMarkerPanel" */ '@flay/panel/FlayMarkerPanel')
        .then(({ FlayMarkerPanel }) => this.#mainElement.appendChild(new FlayMarkerPanel()))
        .then((flayMarkerPanel) => {
          // FlayMarkerPanel 사용
          this.#mainElement.addEventListener('click', (e) => {
            if (e.target !== this.#mainElement) return;
            const inputNumber = e.clientX * e.clientY;
            const flayMarkers = flayMarkerPanel.childNodes;
            const randomIndex = inputNumber % flayMarkers.length;
            flayMarkers[randomIndex].click();
          });
        });
    } else {
      import(/* webpackChunkName: "FlayMarkerSky" */ '@flay/panel/FlayMarkerSky')
        .then(({ FlayMarkerSky }) => this.#mainElement.appendChild(new FlayMarkerSky()))
        .then((flayMarkerSky) => {
          // FlayMarkerSky 사용
        });
    }
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === true ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
