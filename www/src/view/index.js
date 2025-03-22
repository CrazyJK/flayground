import { FlayMarkerPanel } from '../flay/panel/FlayMarkerPanel';
import './inc/Page';
import './index.scss';

class Page {
  constructor() {}

  async start() {
    document.querySelector('body > main').appendChild(new FlayMarkerPanel());
    // body > main 빈공간을 클릭했을때 이벤트
    document.querySelector('body > main').addEventListener('click', (e) => {
      if (e.target === document.querySelector('body > main')) {
        // FlayMarkerPanel의 marker를 랜덤으로 선택해서 클릭
        const flayMarkerList = document.querySelectorAll('.flay-marker-panel .flay-marker');
        const randomIndex = Math.floor(Math.random() * flayMarkerList.length);
        flayMarkerList[randomIndex].click();
      }
    });
  }
}

new Page().start();
