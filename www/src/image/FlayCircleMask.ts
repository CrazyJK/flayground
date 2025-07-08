import DateUtils from '../lib/DateUtils';
import FlayFetch, { ImageData } from '../lib/FlayFetch';
import './FlayCircleMask.scss';

const SECOND = 1000;

/**
 * FlayCircleMask
 */
export class FlayCircleMask extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-circle-mask');
    this.innerHTML = `
      <div class="image-info">
        <span class="image-index"></span>
        <span class="image-name"></span>
        <span class="image-path"></span>
        <span class="image-date"></span>
      </div>
    `;
  }

  connectedCallback(): void {
    this.setupMouseEvents();
    this.start();
  }

  private start(minTime: number = 10, maxTime: number = 20): void {
    FlayFetch.getImageSize().then(async (size: number) => {
      if (size <= 0) {
        console.warn('No images available for FlayCircleMask.');
        return;
      }
      const indices = Array.from({ length: size }, (_, i) => i); // 0부터 length-1까지의 베열 생성

      let imageUrl: string = null; // 현재 표시 중인 이미지 URL
      do {
        if (imageUrl) URL.revokeObjectURL(imageUrl); // 이전 이미지 URL 해제

        const index = indices.splice(Math.floor(Math.random() * indices.length), 1)[0]; // 랜덤으로 인덱스 선택 후 배열에서 제거
        FlayFetch.getStaticImage(index).then((imageData: ImageData) => {
          imageUrl = URL.createObjectURL(imageData.imageBlob); // 이미지 Blob을 URL로 변환
          this.style.backgroundImage = `url(${imageUrl})`;
          this.querySelector('.image-index').innerHTML = `${index} / ${indices.length}`;
          this.querySelector('.image-name').innerHTML = imageData.name;
          this.querySelector('.image-path').innerHTML = imageData.path;
          this.querySelector('.image-date').innerHTML = DateUtils.format(imageData.modified, 'yyyy-MM-dd');
        });

        const waitTime = Math.floor(Math.random() * (maxTime - minTime)) + minTime; // minTime ~ maxTime 사이의 랜덤 시간 대기
        await new Promise((resolve) => setTimeout(resolve, waitTime * SECOND));
      } while (indices.length > 0);

      console.info('All images have been displayed in FlayCircleMask.');
    });
  }

  private setupMouseEvents(): void {
    const updateLastMousePosition = (x: number, y: number): void => {
      [lastMouseX, lastMouseY] = [x, y];
    };
    const updateClipPathProperties = (duration: number, x: number, y: number, newRadius: number | null = radius): void => {
      document.documentElement.style.setProperty('--clip-transition-duration', `${duration}ms`);
      document.documentElement.style.setProperty('--clip-x', `${x - rectX}px`);
      document.documentElement.style.setProperty('--clip-y', `${y - rectY}px`);
      document.documentElement.style.setProperty('--clip-radius', `${newRadius}px`);
    };

    let animationId: number | null = null;
    let lastMouseX: number = 0;
    let lastMouseY: number = 0;
    let rectX: number = 0;
    let rectY: number = 0;
    let radius: number = 0;

    // 마우스가 화면에 들어오면 마스크 표시
    document.addEventListener('mouseenter', (e: MouseEvent) => {
      updateClipPathProperties(50, e.clientX, e.clientY);
      updateLastMousePosition(e.clientX, e.clientY); // 마지막 마우스 위치 업데이트
    });

    // 마우스 움직임에 따라 원형 마스크 업데이트 (requestAnimationFrame으로 최적화)
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (animationId) cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(() => updateClipPathProperties(50, e.clientX, e.clientY));
      updateLastMousePosition(e.clientX, e.clientY); // 마지막 마우스 위치 저장
    });

    // 마우스가 화면을 벗어나면 마지막 위치에서 원이 작아지면서 사라짐
    document.addEventListener('mouseleave', () => {
      if (animationId) cancelAnimationFrame(animationId);
      updateClipPathProperties(500, lastMouseX, lastMouseY, 0); // 마지막 마우스 위치에서 원의 크기를 0으로 축소
    });

    // 클릭 시 전체 화면 마스크 토글
    this.addEventListener('click', () => {
      this.classList.toggle('full-mask'); // 클릭 시 전체 화면 마스크 토글
      updateClipPathProperties(500, lastMouseX, lastMouseY);
    });

    // 휠 스크롤로 원의 반지름 조정
    this.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1; // 휠 스크롤 방향에 따라 반지름 조정
      radius = Math.max(10, radius + delta * 10);
      updateClipPathProperties(200, lastMouseX, lastMouseY); // 현재 마우스 위치에서 클립 패스 업데이트
    });

    // 윈도우 크기 조정 시 오프셋 업데이트
    window.addEventListener('resize', () => {
      const { x, y, width, height } = this.getBoundingClientRect(); // 현재 메인 엘리먼트의 위치를 기준으로 오프셋 계산
      [rectX, rectY] = [x, y];
      radius = Math.min(width, height) / 4; // 원의 반지름을 메인 엘리먼트의 크기에 따라 설정
    });
    window.dispatchEvent(new Event('resize')); // resize 이벤트 일으키기
  }
}

customElements.define('flay-circle-mask', FlayCircleMask, { extends: 'div' });
