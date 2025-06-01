import FlayFetch from '@lib/FlayFetch';
import './imageCircle.scss';

const shapeClasses = { circle: 'circle', square: 'square', rounded: 'rounded' }; // 모양 클래스
const effectClasses = { emboss: 'emboss', engrave: 'engrave' }; // 효과 클래스
const DEFAULT_OPTIONS = { rem: 10, shape: shapeClasses.circle, effect: effectClasses.emboss, duration: 2000, eventAllow: false }; // 기본 옵션

export class ImageCircle extends HTMLDivElement {
  #rem = DEFAULT_OPTIONS.rem; // rem 단위 크기
  #duration = DEFAULT_OPTIONS.duration; // 애니메이션 지속 시간

  constructor(options = DEFAULT_OPTIONS) {
    super();
    this.classList.add('image-circle', 'flay-div');
    this.image = this.appendChild(document.createElement('div'));
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  connectedCallback() {
    this.start();

    this.image.addEventListener('click', (e) => {
      // Calculate center position of the current window
      const centerX = window.screenX + window.innerWidth / 2 - 50; // 50 is half of popup width
      const centerY = window.screenY + window.innerHeight / 2 - 50; // 50 is half of popup height

      window.open(`popup.image.html?idx=${this.dataset.idx}&max=${this.imageLength}`, `image${this.dataset.idx}`, `top=${centerY},left=${centerX},width=100px,height=100px`);
    });
  }

  start() {
    FlayFetch.getImageSize()
      .then(async (imageLength) => {
        if (imageLength === 0) throw new Error('표시할 이미지가 없습니다.');

        let imageIndices = Array.from({ length: imageLength }, (_, i) => i); // imageLength 만큼 배열 생성
        let originalImageIndices = [...imageIndices]; // 초기 인덱스 배열 복사본
        let imageURL = null; // 이미지 URL을 저장할 변수

        const showImage = (randomSize) => {
          if (imageURL) URL.revokeObjectURL(imageURL); // 이전 imageURL이 있다면 해제
          if (imageIndices.length === 0) imageIndices = [...originalImageIndices]; // 모든 이미지가 표시되었으면 원본 복사본으로 초기화

          const randomIndex = Math.floor(Math.random() * imageIndices.length);
          const idx = imageIndices.splice(randomIndex, 1)[0];

          FlayFetch.getStaticImage(idx)
            .then(({ name, path, modified, imageBlob }) => {
              imageURL = URL.createObjectURL(imageBlob);
              this.title = `${name}\n${modified}\n${path}`; // title에 추가 정보 제공
              this.dataset.idx = idx; // 현재 이미지 인덱스 저장
              this.dataset.size = randomSize;
              this.image.style.backgroundImage = `url(${imageURL})`;
              this.image.style.width = randomSize + 'rem';
              this.image.style.height = randomSize + 'rem';
              this.image.style.margin = (this.#rem - randomSize) / 2 + 'rem';
              this.image.animate([{ transform: 'scale(0.1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: this.#duration, easing: 'ease-in-out' });
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
          const randomSize = this.#rem / 2 + Math.floor(Math.random() * (this.#rem - 1)) / 2;
          showImage(randomSize);
          await new Promise((resolve) => setTimeout(resolve, randomSize * 1000)); // 이미지 변경 간격만큼 대기
        } while (condition);
      })
      .catch((error) => {
        console.error('이미지 갯수를 가져오는 중 오류 발생:', error);
      });
  }

  /**
   * @param {{ rem: string; shape: string; effect: string; duration: number; }} opts
   */
  set options(opts) {
    this.#rem = opts.rem;
    this.#duration = opts.duration;
    this.style.width = opts.rem + 'rem';
    this.style.height = opts.rem + 'rem';

    this.classList.remove(...Object.values(shapeClasses), ...Object.values(effectClasses));
    if (shapeClasses[opts.shape]) this.classList.add(shapeClasses[opts.shape]);
    if (effectClasses[opts.effect]) this.classList.add(effectClasses[opts.effect]);
    this.classList.toggle('event-allow', opts.eventAllow);
  }
}

customElements.define('image-circle', ImageCircle, { extends: 'div' });
