import DateUtils from '@lib/DateUtils';
import FlayFetch from '@lib/FlayFetch';
import './inc/Page';
import './index.scss';

class Page {
  #mainElement;

  constructor() {
    this.#mainElement = document.querySelector('body > main');
  }

  async start() {
    this.#mainElement.addEventListener('click', () => this.#showMarkerPanel(), { once: true });
  }

  #showMarkerPanel() {
    this.#mainElement.textContent = null;

    // 랜덤 boolean
    const randomBoolean = Math.random() < 0.5;
    if (randomBoolean) {
      import(/* webpackChunkName: "FlayMarkerPanel" */ '@flay/panel/FlayMarkerPanel')
        .then(({ FlayMarkerPanel }) => this.#mainElement.appendChild(new FlayMarkerPanel()))
        .then((flayMarkerPanel) => {
          this.#mainElement.addEventListener('click', (e) => {
            if (e.target !== this.#mainElement) return;
            const inputNumber = e.clientX * e.clientY;
            const flayMarkers = flayMarkerPanel.childNodes;
            const randomIndex = inputNumber % flayMarkers.length;
            flayMarkers[randomIndex].click();
          });
        });
    } else {
      import(/* webpackChunkName: "FlayMarker" */ '@flay/domain/FlayMarker').then(({ default: FlayMarker }) => {
        FlayFetch.getFlayAll().then(async (list) => {
          const [min, max] = [20, 50];
          const mainElement = document.querySelector('body > main');

          for (const flay of list) {
            const x = Math.floor(Math.random() * (window.innerWidth - (min + max))) + min;
            const y = Math.floor(Math.random() * (window.innerHeight - (min + max))) + min;
            const randomWidth = Math.floor(Math.random() * (max - min)) + min;

            const flayMarker = new FlayMarker(flay, { showTitle: false, shape: 'star' });
            flayMarker.style.position = 'absolute';
            flayMarker.style.zIndex = 1000;
            flayMarker.style.left = `${x}px`;
            flayMarker.style.top = `${y}px`;
            flayMarker.style.width = `${randomWidth}px`;
            flayMarker.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'ease-in-out' });
            mainElement.appendChild(flayMarker);

            await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 700) + 300)); // 300ms~1000ms 대기
          }
        });
      });
    }
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === true ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
