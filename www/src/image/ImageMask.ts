import GroundImage from '@base/GroundImage';
import DateUtils from '@lib/DateUtils';
import FlayFetch, { ImageData } from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import './ImageMask.scss';

const SECOND = 1000;

/**
 * ImageMask
 */
export class ImageMask extends GroundImage {
  private currentImageUrl: string | null = null;
  private isLoopRunning: boolean = false;
  private animationId: number | null = null;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private rectX: number = 0;
  private rectY: number = 0;
  private radius: number = 0;

  // 이벤트 리스너들을 추적하기 위한 변수들
  private mouseenterListener!: (e: MouseEvent) => void;
  private mousemoveListener!: (e: MouseEvent) => void;
  private mouseleaveListener!: () => void;
  private clickListener!: () => void;
  private wheelListener!: (e: WheelEvent) => void;
  private resizeListener!: () => void;

  constructor() {
    super();
    this.classList.add('image-mask');
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

  disconnectedCallback(): void {
    // 이미지 루프 중지
    this.isLoopRunning = false;

    // 애니메이션 프레임 정리
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // 현재 이미지 URL 정리
    if (this.currentImageUrl) {
      URL.revokeObjectURL(this.currentImageUrl);
      this.currentImageUrl = null;
    }

    // 이벤트 리스너 제거
    if (this.mouseenterListener) {
      document.removeEventListener('mouseenter', this.mouseenterListener);
    }
    if (this.mousemoveListener) {
      document.removeEventListener('mousemove', this.mousemoveListener);
    }
    if (this.mouseleaveListener) {
      document.removeEventListener('mouseleave', this.mouseleaveListener);
    }
    if (this.clickListener) {
      this.removeEventListener('click', this.clickListener);
    }
    if (this.wheelListener) {
      this.removeEventListener('wheel', this.wheelListener);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }

    // CSS 변수 정리
    document.documentElement.style.removeProperty('--clip-transition-duration');
    document.documentElement.style.removeProperty('--clip-x');
    document.documentElement.style.removeProperty('--clip-y');
    document.documentElement.style.removeProperty('--clip-radius');

    console.debug('ImageMask disconnected and cleaned up');
  }

  private start(minTime: number = 10, maxTime: number = 20): void {
    this.isLoopRunning = true;

    void FlayFetch.getImageSize().then(async (size: number) => {
      if (size <= 0) {
        console.warn('No images available for ImageMask.');
        return;
      }
      const indices = Array.from({ length: size }, (_, i) => i); // 0부터 length-1까지의 배열 생성

      do {
        if (!this.isLoopRunning) break; // 루프가 중지되었으면 종료

        if (this.currentImageUrl) {
          URL.revokeObjectURL(this.currentImageUrl); // 이전 이미지 URL 해제
          this.currentImageUrl = null;
        }

        const index = indices.splice(RandomUtils.getRandomInt(0, indices.length), 1)[0]; // 랜덤으로 인덱스 선택 후 배열에서 제거

        try {
          const imageData: ImageData = await FlayFetch.getStaticImage(index!);
          if (!this.isLoopRunning) break; // 이미지 로드 중에 중지되었는지 확인

          this.currentImageUrl = URL.createObjectURL(imageData.imageBlob); // 이미지 Blob을 URL로 변환
          this.style.backgroundImage = `url(${this.currentImageUrl})`;
          this.querySelector('.image-index')!.innerHTML = `${index} / ${size}`;
          this.querySelector('.image-name')!.innerHTML = imageData.name;
          this.querySelector('.image-path')!.innerHTML = imageData.path;
          this.querySelector('.image-date')!.innerHTML = DateUtils.format(imageData.modified, 'yyyy-MM-dd');
        } catch (error) {
          console.error('Failed to load image:', error);
          continue;
        }

        const waitTime = RandomUtils.getRandomInt(minTime, maxTime); // minTime ~ maxTime 사이의 랜덤 시간 대기
        await new Promise((resolve) => setTimeout(resolve, waitTime * SECOND));
      } while (indices.length > 0 && this.isLoopRunning);

      if (this.isLoopRunning) {
        console.info('All images have been displayed in ImageMask.');
      }
    });
  }

  private setupMouseEvents(): void {
    const updateLastMousePosition = (x: number, y: number): void => {
      [this.lastMouseX, this.lastMouseY] = [x, y];
    };
    const updateClipPathProperties = (duration: number, x: number, y: number, newRadius: number | null = this.radius): void => {
      document.documentElement.style.setProperty('--clip-transition-duration', `${duration}ms`);
      document.documentElement.style.setProperty('--clip-x', `${x - this.rectX}px`);
      document.documentElement.style.setProperty('--clip-y', `${y - this.rectY}px`);
      document.documentElement.style.setProperty('--clip-radius', `${newRadius}px`);
    };

    // 마우스가 화면에 들어오면 마스크 표시
    this.mouseenterListener = (e: MouseEvent) => {
      updateClipPathProperties(50, e.clientX, e.clientY);
      updateLastMousePosition(e.clientX, e.clientY); // 마지막 마우스 위치 업데이트
    };
    document.addEventListener('mouseenter', this.mouseenterListener);

    // 마우스 움직임에 따라 원형 마스크 업데이트 (requestAnimationFrame으로 최적화)
    this.mousemoveListener = (e: MouseEvent) => {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      this.animationId = requestAnimationFrame(() => updateClipPathProperties(50, e.clientX, e.clientY));
      updateLastMousePosition(e.clientX, e.clientY); // 마지막 마우스 위치 저장
    };
    document.addEventListener('mousemove', this.mousemoveListener);

    // 마우스가 화면을 벗어나면 마지막 위치에서 원이 작아지면서 사라짐
    this.mouseleaveListener = () => {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      updateClipPathProperties(500, this.lastMouseX, this.lastMouseY, 0); // 마지막 마우스 위치에서 원의 크기를 0으로 축소
    };
    document.addEventListener('mouseleave', this.mouseleaveListener);

    // 클릭 시 전체 화면 마스크 토글
    this.clickListener = () => {
      this.classList.toggle('full-mask'); // 클릭 시 전체 화면 마스크 토글
      updateClipPathProperties(500, this.lastMouseX, this.lastMouseY);
    };
    this.addEventListener('click', this.clickListener);

    // 휠 스크롤로 원의 반지름 조정
    this.wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1; // 휠 스크롤 방향에 따라 반지름 조정
      this.radius = Math.max(10, this.radius + delta * 10);
      updateClipPathProperties(200, this.lastMouseX, this.lastMouseY); // 현재 마우스 위치에서 클립 패스 업데이트
    };
    this.addEventListener('wheel', this.wheelListener);

    // 윈도우 크기 조정 시 오프셋 업데이트
    this.resizeListener = () => {
      const { x, y, width, height } = this.getBoundingClientRect(); // 현재 메인 엘리먼트의 위치를 기준으로 오프셋 계산
      [this.rectX, this.rectY] = [x, y];
      this.radius = Math.min(width, height) / 4; // 원의 반지름을 메인 엘리먼트의 크기에 따라 설정
    };
    window.addEventListener('resize', this.resizeListener);
    window.dispatchEvent(new Event('resize')); // resize 이벤트 일으키기
  }
}

customElements.define('image-mask', ImageMask);
