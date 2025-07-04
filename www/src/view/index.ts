import DateUtils from '@lib/DateUtils';
import FlayFetch, { ImageData } from '../lib/FlayFetch';
import './inc/Page';
import './index.scss';

/**
 * 메인 페이지 클래스
 */
class Page {
  private mainElement: HTMLElement | null = null;
  private offsetX: number = 0; // 마우스 X 좌표
  private offsetY: number = 0; // 마우스 Y 좌표
  private lastMouseX: number = 0; // 마지막 마우스 X 위치
  private lastMouseY: number = 0; // 마지막 마우스 Y 위치
  private radius: number = 0; // 원의 반지름

  async start(): Promise<void> {
    this.mainElement = document.querySelector('body > main') as HTMLElement;
    if (!this.mainElement) {
      console.error('Main element not found');
      return;
    }

    this.mainElement.style.clipPath = 'circle(0px at 50% 50%)'; // 초기에는 배경을 완전히 숨김

    const length = await FlayFetch.getImageSize();
    const randomIndex = Math.floor(Math.random() * length);
    const imageData: ImageData = await FlayFetch.getStaticImage(randomIndex);
    const imageUrl = URL.createObjectURL(imageData.imageBlob);

    this.setupMouseEvents(); // 마우스 이벤트 리스너 추가

    this.mainElement.style.backgroundImage = `url(${imageUrl})`;
  }

  private decideOffsetXY(): void {
    const { x, y } = this.mainElement.getBoundingClientRect(); // 현재 메인 엘리먼트의 위치를 기준으로 오프셋 계산
    this.offsetX = x;
    this.offsetY = y;
    this.radius = Math.min(this.mainElement.offsetWidth, this.mainElement.offsetHeight) / 4; // 원의 반지름을 메인 엘리먼트의 크기에 따라 설정
  }

  private setupMouseEvents(): void {
    let animationId: number | null = null;

    // 마우스 움직임에 따라 원형 마스크 업데이트 (requestAnimationFrame으로 최적화)
    document.addEventListener('mousemove', (e: MouseEvent) => {
      this.updateLastMousePosition(e); // 마지막 마우스 위치 저장
      if (this.mainElement.style.transition !== 'clip-path 0.1s ease-out') {
        this.mainElement.style.transition = 'clip-path 0.1s ease-out'; // 마우스 이동 시에는 빠른 transition
      }
      if (animationId) cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(() => this.updateClipPath(e.clientX, e.clientY));
    });

    // 마우스가 화면을 벗어나면 마지막 위치에서 원이 작아지면서 사라짐
    document.addEventListener('mouseleave', () => {
      if (animationId) cancelAnimationFrame(animationId);
      this.mainElement.style.transition = 'clip-path 0.5s ease-in'; // 부드러운 축소 애니메이션을 위한 transition 설정
      this.mainElement.style.clipPath = `circle(0px at ${this.lastMouseX - this.offsetX}px ${this.lastMouseY - this.offsetY}px)`; // 마지막 마우스 위치에서 원의 크기를 0으로 축소
    });

    // 마우스가 화면에 들어오면 마스크 표시
    document.addEventListener('mouseenter', (e: MouseEvent) => {
      this.updateLastMousePosition(e); // 마지막 마우스 위치 업데이트
      this.mainElement.style.transition = 'clip-path 0.3s ease-out'; // 마우스 이동 시에는 빠른 transition으로 복원
      this.updateClipPath(e.clientX, e.clientY);
    });

    window.addEventListener('resize', () => this.decideOffsetXY()); // 윈도우 크기 조정 시 오프셋 업데이트
    this.decideOffsetXY(); // 초기 오프셋 계산
  }

  private updateClipPath(x: number, y: number): void {
    this.mainElement.style.clipPath = `circle(${this.radius}px at ${x - this.offsetX}px ${y - this.offsetY}px)`; // 클립 패스 업데이트
  }

  private updateLastMousePosition(e: MouseEvent): void {
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === 'true' ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
