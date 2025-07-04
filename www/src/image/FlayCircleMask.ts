import FlayFetch, { ImageData } from '../lib/FlayFetch';
import './FlayCircleMask.scss';

/**
 * FlayCircleMask
 */
export class FlayCircleMask extends HTMLDivElement {
  private offsetX: number = 0; // 마우스 X 좌표
  private offsetY: number = 0; // 마우스 Y 좌표
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
      this.classList.add('mouse-move');
      this.updateClipPath(e.clientX, e.clientY);
      this.updateLastMousePosition(e.clientX, e.clientY); // 마지막 마우스 위치 업데이트
    });

    // 마우스 움직임에 따라 원형 마스크 업데이트 (requestAnimationFrame으로 최적화)
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (animationId) cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(() => this.updateClipPath(e.clientX, e.clientY));
      this.updateLastMousePosition(e.clientX, e.clientY); // 마지막 마우스 위치 저장
    });

    // 마우스가 화면을 벗어나면 마지막 위치에서 원이 작아지면서 사라짐
    document.addEventListener('mouseleave', () => {
      if (animationId) cancelAnimationFrame(animationId);
      this.classList.remove('mouse-move');
      this.style.clipPath = `circle(0px at ${this.lastMouseX - this.offsetX}px ${this.lastMouseY - this.offsetY}px)`; // 마지막 마우스 위치에서 원의 크기를 0으로 축소
    });

    this.addEventListener('click', () => {
      this.classList.toggle('full-mask'); // 클릭 시 전체 화면 마스크 토글
    });

    this.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1; // 휠 스크롤 방향에 따라 반지름 조정
      this.radius = Math.max(0, this.radius + delta * 10);
      this.updateClipPath(this.lastMouseX, this.lastMouseY); // 현재 마우스 위치에서 클립 패스 업데이트
    });

    window.addEventListener('resize', () => this.decideOffsetXY()); // 윈도우 크기 조정 시 오프셋 업데이트
    this.decideOffsetXY(); // 초기 오프셋 계산
  }

  private decideOffsetXY(): void {
    const { x, y, width, height } = this.getBoundingClientRect(); // 현재 메인 엘리먼트의 위치를 기준으로 오프셋 계산
    [this.offsetX, this.offsetY] = [x, y];
    this.radius = Math.min(width, height) / 4; // 원의 반지름을 메인 엘리먼트의 크기에 따라 설정
  }

  private updateClipPath(x: number, y: number): void {
    this.style.clipPath = `circle(${this.radius}px at ${x - this.offsetX}px ${y - this.offsetY}px)`; // 클립 패스 업데이트
  }

  private updateLastMousePosition(x: number, y: number): void {
    [this.lastMouseX, this.lastMouseY] = [x, y];
  }
}

customElements.define('flay-circle-mask', FlayCircleMask, { extends: 'div' });
