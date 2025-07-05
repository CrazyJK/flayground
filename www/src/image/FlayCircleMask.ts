import FlayFetch, { ImageData } from '../lib/FlayFetch';
import './FlayCircleMask.scss';

/**
 * FlayCircleMask
 */
export class FlayCircleMask extends HTMLDivElement {
  private rectX: number = 0; // 이 요소의 x 위치
  private rectY: number = 0; // 이 요소의 y 위치
  private lastMouseX: number = 0; // 마지막 마우스 X 위치
  private lastMouseY: number = 0; // 마지막 마우스 Y 위치
  private radius: number = 0; // 원의 반지름

  constructor() {
    super();
    this.classList.add('flay-circle-mask');
  }

  connectedCallback(): void {
    this.setupMouseEvents();
    this.start();
  }

  private start(): void {
    let imageUrl: string = ''; // 현재 표시 중인 이미지 URL
    FlayFetch.getImageSize().then(async (size: number) => {
      const indices = Array.from({ length: size }, (_, i) => i); // 0부터 length-1까지의 베열 생성

      do {
        const randomIndex = Math.floor(Math.random() * indices.length); // indices에서 랜덤하게 뽑기
        const index = indices[randomIndex];
        indices.splice(randomIndex, 1); // 뽑은 인덱스는 제거

        if (imageUrl) URL.revokeObjectURL(imageUrl); // 이전 이미지 URL 해제
        FlayFetch.getStaticImage(index).then((imageData: ImageData) => {
          imageUrl = URL.createObjectURL(imageData.imageBlob);
          this.style.backgroundImage = `url(${imageUrl})`; // 이미지 URL 설정
        });

        // 10 ~ 20초 사이의 랜덤 시간 대기
        const waitTime = Math.floor(Math.random() * 10000) + 10000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } while (indices.length > 0);
    });
  }

  private setupMouseEvents(): void {
    let animationId: number | null = null;

    // 마우스가 화면에 들어오면 마스크 표시
    document.addEventListener('mouseenter', (e: MouseEvent) => {
      this.updateClipPathProperties(50, e.clientX, e.clientY);
      this.updateLastMousePosition(e.clientX, e.clientY); // 마지막 마우스 위치 업데이트
    });

    // 마우스 움직임에 따라 원형 마스크 업데이트 (requestAnimationFrame으로 최적화)
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (animationId) cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(() => this.updateClipPathProperties(50, e.clientX, e.clientY));
      this.updateLastMousePosition(e.clientX, e.clientY); // 마지막 마우스 위치 저장
    });

    // 마우스가 화면을 벗어나면 마지막 위치에서 원이 작아지면서 사라짐
    document.addEventListener('mouseleave', () => {
      if (animationId) cancelAnimationFrame(animationId);
      this.updateClipPathProperties(500, this.lastMouseX, this.lastMouseY, 0); // 마지막 마우스 위치에서 원의 크기를 0으로 축소
    });

    // 클릭 시 전체 화면 마스크 토글
    this.addEventListener('click', () => {
      this.classList.toggle('full-mask'); // 클릭 시 전체 화면 마스크 토글
      this.updateClipPathProperties(500, this.lastMouseX, this.lastMouseY);
    });

    // 휠 스크롤로 원의 반지름 조정
    this.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1; // 휠 스크롤 방향에 따라 반지름 조정
      this.radius = Math.max(0, this.radius + delta * 10);
      this.updateClipPathProperties(200, this.lastMouseX, this.lastMouseY); // 현재 마우스 위치에서 클립 패스 업데이트
    });

    // 윈도우 크기 조정 시 오프셋 업데이트
    window.addEventListener('resize', () => {
      const { x, y, width, height } = this.getBoundingClientRect(); // 현재 메인 엘리먼트의 위치를 기준으로 오프셋 계산
      [this.rectX, this.rectY] = [x, y];
      this.radius = Math.min(width, height) / 4; // 원의 반지름을 메인 엘리먼트의 크기에 따라 설정
    });
    window.dispatchEvent(new Event('resize')); // resize 이벤트 일으키기
  }

  private updateClipPathProperties(duration: number, x: number, y: number, radius: number | null = this.radius): void {
    document.documentElement.style.setProperty('--clip-transition-duration', `${duration}ms`);
    document.documentElement.style.setProperty('--clip-x', `${x - this.rectX}px`);
    document.documentElement.style.setProperty('--clip-y', `${y - this.rectY}px`);
    document.documentElement.style.setProperty('--clip-radius', `${radius}px`);
  }

  private updateLastMousePosition(x: number, y: number): void {
    [this.lastMouseX, this.lastMouseY] = [x, y];
  }
}

customElements.define('flay-circle-mask', FlayCircleMask, { extends: 'div' });
