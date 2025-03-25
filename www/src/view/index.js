import './inc/Page';
import './index.scss';

import { FlayMarkerPanel } from '../flay/panel/FlayMarkerPanel';

class Page {
  constructor() {}

  async start() {
    const mainElement = document.querySelector('body > main');
    mainElement.appendChild(new FlayMarkerPanel());
    mainElement.addEventListener('click', (e) => {
      if (e.target !== mainElement) return;
      const flayMarkers = document.querySelectorAll('.flay-marker-panel .flay-marker');
      const inputNumber = e.clientX * e.clientY;
      const randomIndex = inputNumber % flayMarkers.length;
      flayMarkers[randomIndex].click();
    });
  }
}

new Page().start();
