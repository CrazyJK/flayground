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
  }

  #showMarkerPanel() {
    this.#mainElement.textContent = null;

    // 랜덤 boolean
    const randomBoolean = Math.random() < 0.5;
    if (randomBoolean) {
      // FlayMarkerPanel 사용
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
      // FlayMarkerSky 커스텀 엘리먼트 사용
      import(/* webpackChunkName: "FlayMarkerSky" */ '@flay/panel/FlayMarkerSky')
        .then(({ FlayMarkerSky }) => {
          // FlayMarkerSky 커스텀 엘리먼트 생성 및 추가
          const flayMarkerSky = new FlayMarkerSky();

          // 화면에 FlayMarkerSky 추가
          this.#mainElement.appendChild(flayMarkerSky);

          // 화면 전체를 커버하도록 스타일 설정
          flayMarkerSky.style.position = 'absolute';
          flayMarkerSky.style.top = '0';
          flayMarkerSky.style.left = '0';
          flayMarkerSky.style.width = '100%';
          flayMarkerSky.style.height = '100%';

          // 화면 클릭 이벤트 처리
          this.#mainElement.addEventListener('click', (e) => {
            if (e.target === this.#mainElement || e.target === flayMarkerSky) {
              // 빈 공간 클릭 시 랜덤한 별 선택
              const flayMarkers = flayMarkerSky.querySelectorAll('.flay-marker');
              if (flayMarkers.length > 0) {
                const inputNumber = e.clientX * e.clientY;
                const randomIndex = inputNumber % flayMarkers.length;
                flayMarkers[randomIndex].click();
              }
            }
          });

          // 콘솔에 로그 출력
          console.log('FlayMarkerSky 컴포넌트가 초기화되었습니다.');
        })
        .catch((error) => {
          console.error('FlayMarkerSky 로딩 실패:', error);

          // 에러 메시지 표시
          const errorMsg = document.createElement('div');
          errorMsg.className = 'error-message';
          errorMsg.textContent = 'FlayMarkerSky 컴포넌트 로딩에 실패했습니다';
          this.#mainElement.appendChild(errorMsg);
        });
    }
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === true ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
