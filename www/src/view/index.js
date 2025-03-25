import { FlayMarkerPanel } from '../flay/panel/FlayMarkerPanel';
import './inc/Page';
import './index.scss';

class Page {
  constructor() {}

  async start() {
    document.querySelector('body > main').appendChild(new FlayMarkerPanel());

    document.querySelector('body > main').addEventListener('click', (e) => {
      if (e.target !== document.querySelector('body > main')) return;

      const flayMarkerList = document.querySelectorAll('.flay-marker-panel .flay-marker');
      const inputNumber = e.clientX * e.clientY;
      const randomIndex = inputNumber % flayMarkerList.length;
      flayMarkerList[randomIndex].click();
    });
  }
}

new Page().start();
