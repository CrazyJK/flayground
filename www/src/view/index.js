import { addResizeListener } from '@/lib/windowAddEventListener';
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
      const getRandomPosition = () => {
        const [min, max] = [20, 50];
        const x = Math.floor(Math.random() * (window.innerWidth - (min + max))) + min;
        const y = Math.floor(Math.random() * (window.innerHeight - (min + max))) + min;
        const randomWidth = Math.floor(Math.random() * (max - min)) + min;
        return { x, y, randomWidth };
      };

      import(/* webpackChunkName: "FlayMarker" */ '@flay/domain/FlayMarker').then(({ default: FlayMarker }) => {
        FlayFetch.getFlayAll().then(async (list) => {
          const mainElement = document.querySelector('body > main');

          for (const flay of list) {
            const { x, y, randomWidth } = getRandomPosition();

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
        addResizeListener(() => {
          // 리사이즈 시 모든 마커를 위치를 window에 맞게 새로고침 처리
          requestAnimationFrame(() => {
            document.querySelectorAll('body > main > .flay-marker').forEach((flayMarker) => {
              const { x, y, randomWidth } = getRandomPosition();
              flayMarker.style.left = `${x}px`;
              flayMarker.style.top = `${y}px`;
              flayMarker.style.width = `${randomWidth}px`;
              flayMarker.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'ease-in-out' });
            });
          });
        });
      });
    }
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === true ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
