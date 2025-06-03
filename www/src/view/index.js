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

    import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ effect: 'engrave', eventAllow: true }))
      .then((imageCircle) => {
        imageCircle.style.position = 'fixed';
        imageCircle.style.right = 0;
        imageCircle.style.bottom = 0;
        this.#mainElement.appendChild(imageCircle);
      });
  }

  #showMarkerPanel() {
    const randomBoolean = Math.random() < 0.5;
    if (randomBoolean) {
      import(/* webpackChunkName: "FlayMarkerPanel" */ '@flay/panel/FlayMarkerPanel')
        .then(({ FlayMarkerPanel }) => new FlayMarkerPanel())
        .then((flayMarkerPanel) => {
          this.#mainElement.appendChild(flayMarkerPanel);
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
        .then(({ FlayMarkerSky }) => new FlayMarkerSky())
        .then((flayMarkerSky) => {
          this.#mainElement.appendChild(flayMarkerSky);
        });
    }
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === true ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
