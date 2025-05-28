import FlayFetch from '@/lib/FlayFetch';
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

FlayFetch.getImageSize()
  .then(async (imageLength) => {
    if (imageLength === 0) {
      console.warn('표시할 이미지가 없습니다.');
      return;
    }
    // imageLength 만큼 배열 생성
    let imageIndices = Array.from({ length: imageLength }, (_, i) => i);
    let originalImageIndices = [...imageIndices]; // 초기 인덱스 배열 복사본

    const imagePanel = document.body.appendChild(document.createElement('div'));
    imagePanel.className = 'image-panel';

    let imageURL; // 이전 이미지 URL을 저장하기 위한 변수

    const showImage = (randomSize) => {
      if (imageURL) {
        URL.revokeObjectURL(imageURL); // 이전 imageURL이 있다면 해제
      }

      if (imageIndices.length === 0) {
        imageIndices = [...originalImageIndices]; // 모든 이미지가 표시되었으면 원본 복사본으로 초기화
        console.log('모든 이미지를 표시하여 목록을 초기화합니다.');
      }

      const randomIndex = Math.floor(Math.random() * imageIndices.length);
      const idx = imageIndices.splice(randomIndex, 1)[0];

      FlayFetch.getStaticImage(idx)
        .then(({ name, path, modified, imageBlob }) => {
          imageURL = URL.createObjectURL(imageBlob);
          imagePanel.dataset.size = randomSize;
          imagePanel.title = `${name}\n${modified}\n${path}`; // title에 추가 정보 제공
          imagePanel.style.backgroundImage = `url(${imageURL})`;
          imagePanel.style.width = randomSize + 'rem';
          imagePanel.style.height = randomSize + 'rem';
          imagePanel.style.margin = (10 - randomSize) / 2 + 'rem';
          imagePanel.animate([{ transform: 'scale(0.1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 2000, easing: 'ease-in-out' });
        })
        .catch((error) => {
          console.error(`이미지(idx: ${idx})를 가져오는 중 오류 발생:`, error);
          // 오류 발생 시 다음 이미지 시도 또는 특정 오류 처리 로직 추가 가능
          if (imageIndices.length > 0) {
            // 아직 보여줄 이미지가 남았다면
            showImage(); // 다음 이미지 즉시 시도
          }
        });
    };

    const condition = true; // 조건을 true로 설정하여 무한 루프를 방지
    do {
      const randomSize = 5 + Math.floor(Math.random() * 9) * 0.5; // 5rem에서 9rem 사이의 크기
      showImage(randomSize);
      await new Promise((resolve) => setTimeout(resolve, randomSize * 1000)); // 이미지 변경 간격만큼 대기
    } while (condition);
  })
  .catch((error) => {
    console.error('이미지 갯수를 가져오는 중 오류 발생:', error);
  });
