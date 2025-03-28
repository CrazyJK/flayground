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
    import(/* webpackChunkName: "FlayMarkerPanel" */ '../flay/panel/FlayMarkerPanel')
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
  }
}

new Page().start();
