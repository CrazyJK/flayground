import FlayFetch from '@/lib/FlayFetch';
import './imageCircle.scss';

export class ImageCircle extends HTMLDivElement {
  #imageURL;

  constructor(size = 10) {
    super();
    this.classList.add('image-circle', 'flay-div');
    this.size = size;
    this.style.width = size + 'rem';
    this.style.height = size + 'rem';
    this.image = this.appendChild(document.createElement('div'));
  }

  connectedCallback() {
    FlayFetch.getImageSize()
      .then(async (imageLength) => {
        if (imageLength === 0) {
          console.warn('표시할 이미지가 없습니다.');
          return;
        }
        // imageLength 만큼 배열 생성
        let imageIndices = Array.from({ length: imageLength }, (_, i) => i);
        let originalImageIndices = [...imageIndices]; // 초기 인덱스 배열 복사본

        const showImage = (randomSize) => {
          if (this.#imageURL) {
            URL.revokeObjectURL(this.#imageURL); // 이전 imageURL이 있다면 해제
          }

          if (imageIndices.length === 0) {
            imageIndices = [...originalImageIndices]; // 모든 이미지가 표시되었으면 원본 복사본으로 초기화
            console.log('모든 이미지를 표시하여 목록을 초기화합니다.');
          }

          const randomIndex = Math.floor(Math.random() * imageIndices.length);
          const idx = imageIndices.splice(randomIndex, 1)[0];

          FlayFetch.getStaticImage(idx)
            .then(({ name, path, modified, imageBlob }) => {
              this.#imageURL = URL.createObjectURL(imageBlob);
              this.dataset.size = randomSize;
              this.title = `${name}\n${modified}\n${path}`; // title에 추가 정보 제공
              this.image.style.backgroundImage = `url(${this.#imageURL})`;
              this.image.style.width = randomSize + 'rem';
              this.image.style.height = randomSize + 'rem';
              this.image.style.margin = (this.size - randomSize) / 2 + 'rem';
              this.image.animate([{ transform: 'scale(0.1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 2000, easing: 'ease-in-out' });
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

        const condition = true; // 무한 루프를 위한 조건, 필요에 따라 변경 가능
        do {
          const randomSize = this.size / 2 + Math.floor(Math.random() * (this.size - 1)) * 0.5;
          showImage(randomSize);
          await new Promise((resolve) => setTimeout(resolve, randomSize * 1000)); // 이미지 변경 간격만큼 대기
        } while (condition);
      })
      .catch((error) => {
        console.error('이미지 갯수를 가져오는 중 오류 발생:', error);
      });
  }
}

customElements.define('image-circle', ImageCircle, { extends: 'div' });
