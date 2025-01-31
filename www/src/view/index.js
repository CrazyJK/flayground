import { FlayMarkerPanel } from '../flay/panel/FlayMarkerPanel';
import './inc/Page';
import './index.scss';

class Page {
  constructor() {}

  async start() {
    document.querySelector('body > main').appendChild(new FlayMarkerPanel());
  }
}

new Page().start();
