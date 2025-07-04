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

  async start(): Promise<void> {
    this.mainElement = document.querySelector('body > main') as HTMLElement;
    this.offsetX = 0;
    this.offsetY = 0;

    const length = await FlayFetch.getImageSize();
    const randomIndex = Math.floor(Math.random() * length);
    const imageData: ImageData = await FlayFetch.getStaticImage(randomIndex);
    const imageUrl = URL.createObjectURL(imageData.imageBlob);
    this.mainElement.style.backgroundImage = `url(${imageUrl})`;

    // 초기에는 배경을 완전히 숨김
    this.mainElement.style.clipPath = 'circle(0px at 50% 50%)';

    // 마우스 이벤트 리스너 추가
    this.setupMouseEvents();
  }

  private decideOffsetXY(): void {
    if (!this.mainElement) return;
    // 현재 메인 엘리먼트의 위치를 기준으로 오프셋 계산
    const { x, y } = this.mainElement.getBoundingClientRect();
    this.offsetX = x;
    this.offsetY = y;
  }

  private setupMouseEvents(): void {
    if (!this.mainElement) return;

    let animationId: number | null = null;

    // 마우스 움직임에 따라 원형 마스크 업데이트 (requestAnimationFrame으로 최적화)
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      animationId = requestAnimationFrame(() => {
        this.updateClipPath(e.clientX, e.clientY);
      });
    });

    // 마우스가 화면을 벗어나면 마스크 숨김
    document.addEventListener('mouseleave', () => {
      if (this.mainElement) {
        this.mainElement.style.clipPath = 'circle(0px at 50% 50%)';
      }
    });

    // 마우스가 화면에 들어오면 마스크 표시
    document.addEventListener('mouseenter', (e: MouseEvent) => {
      this.updateClipPath(e.clientX, e.clientY);
    });

    window.addEventListener('resize', () => {
      // 윈도우 크기 조정 시 클립 패스 업데이트
      this.decideOffsetXY();
    });
    this.decideOffsetXY(); // 초기 오프셋 계산
  }

  private updateClipPath(x: number, y: number): void {
    if (!this.mainElement) return;

    // 실제 rem 값을 동적으로 계산
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const radius = 10 * rootFontSize; // 10rem을 픽셀로 변환

    // 클립 패스 업데이트
    this.mainElement.style.clipPath = `circle(${radius}px at ${x - this.offsetX}px ${y - this.offsetY}px)`;
  }
}

new Page().start();

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === 'true' ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');
