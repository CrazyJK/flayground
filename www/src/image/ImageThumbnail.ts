import { EventCode } from '@const/GroundConstant';
import FlayDiv from '@flay/FlayDiv';
import FlayFetch from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import StyleUtils from '@lib/StyleUtils';
import { addResizeListener } from '@lib/windowAddEventListener';

export class ImageThumbnail extends FlayDiv {
  private static readonly ThumbnailDimensions = [3, 4];
  private static readonly ThumbnailScalingFactor = 5;

  private static readonly ThumbnailWidth = ImageThumbnail.ThumbnailDimensions[0]! * ImageThumbnail.ThumbnailScalingFactor; // in rem
  private static readonly ThumbnailHeight = ImageThumbnail.ThumbnailDimensions[1]! * ImageThumbnail.ThumbnailScalingFactor; // in rem

  private static readonly AnimationDuration = 1200; // 1.2 seconds for all animations
  private static readonly ChangeImageDelay = Math.floor(ImageThumbnail.AnimationDuration * 0.5);
  private static readonly RemoveClassDelay = Math.floor(ImageThumbnail.AnimationDuration * 0.5);

  private imageLength: number = 0;
  private columnCount: number = 0;
  private rowCount: number = 0;
  private maximumThumbnailCount: number = 0;
  private currentImageIndex: number = 0;
  private keydownListener!: (event: Event) => void;
  private removeResizeListener!: () => void;
  private clickListener!: (event: Event) => void;
  private slideshowInterval: number | null = null;
  private isSlideshowActive: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-content: space-around;
          justify-content: space-around;
          perspective: 1000px;
          transform-style: preserve-3d;
        }
        img {
          width: ${ImageThumbnail.ThumbnailWidth}rem;
          height: ${ImageThumbnail.ThumbnailHeight}rem;
          object-fit: cover;
          clip-path: inset(0.5rem round 10%);
          display: inline-block;
          margin: 0;
          padding: 0;
          opacity: 0;
          transform: scale(1) translateZ(0);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform-style: preserve-3d;
          backface-visibility: hidden;
          will-change: transform, opacity;
          contain: layout;
        }
        img.loaded {
          opacity: 1;
        }
        img:hover {
          transform: scale(1.2) translateZ(0);
          z-index: 1;
          transition: all 0.2s ease-out;
        }

        /* 다양한 자연스러운 애니메이션 효과 */
        img.fading {
          animation: fade-transition ${ImageThumbnail.AnimationDuration}ms ease-in-out;
          will-change: opacity, transform;
        }

        img.morphing {
          animation: morph-scale ${ImageThumbnail.AnimationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform, opacity;
        }

        img.blurring {
          animation: blur-fade ${ImageThumbnail.AnimationDuration}ms ease-in-out;
          will-change: filter, opacity, transform;
        }

        @keyframes fade-transition {
          0% {
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
          20% {
            opacity: 0.8;
            transform: scale(1.01) translateZ(0);
          }
          50% {
            opacity: 0;
            transform: scale(1.02) translateZ(0);
          }
          80% {
            opacity: 0.8;
            transform: scale(1.01) translateZ(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
        }

        @keyframes morph-scale {
          0% {
            transform: scale(1) translateZ(0);
            opacity: 1;
          }
          25% {
            transform: scale(0.9) translateZ(0);
            opacity: 0.9;
          }
          50% {
            transform: scale(0.7) translateZ(0);
            opacity: 0.3;
          }
          75% {
            transform: scale(0.9) translateZ(0);
            opacity: 0.9;
          }
          100% {
            transform: scale(1) translateZ(0);
            opacity: 1;
          }
        }

        @keyframes blur-fade {
          0% {
            filter: blur(0px);
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
          30% {
            filter: blur(2px);
            opacity: 0.7;
            transform: scale(1.01) translateZ(0);
          }
          50% {
            filter: blur(5px);
            opacity: 0.2;
            transform: scale(1.02) translateZ(0);
          }
          70% {
            filter: blur(2px);
            opacity: 0.7;
            transform: scale(1.01) translateZ(0);
          }
          100% {
            filter: blur(0px);
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
        }
      </style>
    `;
  }

  connectedCallback() {
    void this.start();
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.keydownListener);
    this.shadowRoot!.removeEventListener('click', this.clickListener);
    this.removeResizeListener();
    this.stopSlideshow();
  }

  private async start() {
    this.imageLength = await FlayFetch.getImageSize();
    this.currentImageIndex = RandomUtils.getRandomInt(0, this.imageLength);
    this.initializeEventListeners();
    this.setupThumbnailGallery();
    this.startSlideshow();
  }

  private initializeEventListeners() {
    this.removeResizeListener = addResizeListener(() => {
      this.setupThumbnailGallery();
      this.renderGalleryThumbnails('next');
    });

    this.parentElement!.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();

      // 휠 이벤트가 발생하면 슬라이드쇼를 중지
      if (this.isSlideshowActive) {
        this.stopSlideshow();
      }

      event.deltaY < 0 ? this.previous() : this.next();
    });

    this.keydownListener = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      console.debug(`Key pressed: ${keyboardEvent.key} ${keyboardEvent.code}`);

      // 슬라이드쇼가 진행 중일 때는 아무 키나 누르면 정지
      if (this.isSlideshowActive) {
        this.stopSlideshow();
        if (keyboardEvent.code === EventCode.SPACE) {
          return;
        }
      }

      switch (keyboardEvent.code) {
        case EventCode.ARROW_LEFT:
          this.previous();
          break;
        case EventCode.ARROW_RIGHT:
          this.next();
          break;
        case EventCode.KEY_R:
          this.random();
          break;
        case EventCode.SPACE:
          this.startSlideshow();
          break;
      }
    };
    window.addEventListener('keydown', this.keydownListener);

    this.clickListener = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      console.debug(`Click event on: ${target.tagName}`);
      if (target.tagName === 'IMG') {
        const imageIndex = parseInt(target.dataset.index ?? '0', 10);
        const [w, h] = [100, 100]; // 팝업 크기 (100px x 100px)
        const centerX = window.screenX + window.innerWidth / 2 - w / 2;
        const centerY = window.screenY + window.innerHeight / 2 - h / 2;
        window.open(`popup.image.html#${imageIndex}`, `image${imageIndex}`, `top=${centerY},left=${centerX},width=${w}px,height=${h}px`);
      }
    };
    this.shadowRoot!.addEventListener('click', this.clickListener);
  }

  private next() {
    this.currentImageIndex = (this.currentImageIndex + this.maximumThumbnailCount) % this.imageLength;
    this.renderGalleryThumbnails('next');
  }

  private previous() {
    this.currentImageIndex = (this.currentImageIndex - this.maximumThumbnailCount) % this.imageLength;
    this.renderGalleryThumbnails('previous');
  }

  private random() {
    this.currentImageIndex = RandomUtils.getRandomInt(0, this.imageLength);
    this.renderGalleryThumbnails('random');
  }

  private setupThumbnailGallery() {
    this.columnCount = Math.floor(this.clientWidth / StyleUtils.remToPx(ImageThumbnail.ThumbnailWidth));
    this.rowCount = Math.floor(this.clientHeight / StyleUtils.remToPx(ImageThumbnail.ThumbnailHeight));
    this.maximumThumbnailCount = this.columnCount * this.rowCount;

    this.shadowRoot!.querySelectorAll('img').forEach((img) => img.remove());
    for (let i = 0; i < this.maximumThumbnailCount; i++) {
      const img = this.shadowRoot!.appendChild(document.createElement('img'));
      img.id = `thumbnail-${i}`;
    }
  }

  private renderGalleryThumbnails(direction: 'next' | 'previous' | 'random' = 'next') {
    // 애니메이션 순서 결정
    const animationOrder: number[] = [];

    if (direction === 'next') {
      // 1행, 2행, 3행... 순서로 애니메이션
      for (let row = 0; row < this.rowCount; row++) {
        animationOrder.push(row);
      }
    } else if (direction === 'previous') {
      // n행, n-1행, n-2행... 순서로 애니메이션
      for (let row = this.rowCount - 1; row >= 0; row--) {
        animationOrder.push(row);
      }
    } else {
      // random - 모든 이미지를 랜덤 순서로 애니메이션
      for (let i = 0; i < this.maximumThumbnailCount; i++) {
        animationOrder.push(i);
      }
      // Fisher-Yates shuffle 알고리즘
      for (let i = animationOrder.length - 1; i > 0; i--) {
        const j = RandomUtils.getRandomIntInclusive(0, i);
        [animationOrder[i], animationOrder[j]] = [animationOrder[j]!, animationOrder[i]!];
      }
    }

    // 애니메이션 적용
    if (direction === 'random') {
      // 랜덤 모드: 각 이미지마다 개별적으로 애니메이션
      animationOrder.forEach((imageIndex, orderIndex) => {
        const delayTime = orderIndex * 50; // 50ms씩 지연

        setTimeout(() => {
          this.animateImage(imageIndex);
        }, delayTime);
      });
    } else {
      // next/previous 모드: 행 단위로 애니메이션
      animationOrder.forEach((row, orderIndex) => {
        const delayTime = orderIndex * 200; // 각 행마다 200ms씩 지연

        setTimeout(() => {
          // 현재 행의 모든 컬럼을 동시에 처리
          for (let col = 0; col < this.columnCount; col++) {
            const imageIndex = row * this.columnCount + col;
            this.animateImage(imageIndex);
          }
        }, delayTime);
      });
    }
  }

  private animateImage(imageIndex: number) {
    const img = this.shadowRoot!.querySelector(`#thumbnail-${imageIndex}`) as HTMLImageElement;
    const actualImageIndex = (this.currentImageIndex + imageIndex) % this.imageLength;
    const [animationClassName, loadedClassName] = ['blurring', 'loaded'];

    // 이미지 로드 전 클래스 제거
    img.classList.remove(loadedClassName);

    // 블러 페이드 효과 적용
    img.classList.add(animationClassName);

    // 애니메이션 중간 지점에서 이미지 변경
    setTimeout(() => {
      img.src = FlayFetch.getImageURL(actualImageIndex);
      img.alt = `Image ${actualImageIndex}`;

      // 이미지 로드 완료 시 효과
      img.onload = () => {
        img.classList.add(loadedClassName);
        // 애니메이션 완료 후 클래스 제거
        setTimeout(() => {
          img.classList.remove(animationClassName);
        }, ImageThumbnail.RemoveClassDelay);
      };

      // 이미지 로드 실패 시에도 효과 적용
      img.onerror = () => {
        img.classList.add(loadedClassName);
        setTimeout(() => {
          img.classList.remove(animationClassName);
        }, ImageThumbnail.RemoveClassDelay);
      };
    }, ImageThumbnail.ChangeImageDelay);
  }

  private startSlideshow() {
    if (this.isSlideshowActive) return;

    this.isSlideshowActive = true;
    console.debug('Slideshow started');

    const nextSlide = () => {
      if (!this.isSlideshowActive) return;

      this.next();

      // 다음 슬라이드를 위한 랜덤 간격 설정 (10-20초)
      const randomInterval = RandomUtils.getRandomInt(10000, 20000); // 10000ms ~ 20000ms
      this.slideshowInterval = window.setTimeout(nextSlide, randomInterval);
    };

    // 첫 번째 슬라이드 시작
    nextSlide();
  }

  private stopSlideshow() {
    if (!this.isSlideshowActive) return;

    this.isSlideshowActive = false;

    if (this.slideshowInterval) {
      window.clearTimeout(this.slideshowInterval);
      this.slideshowInterval = null;
    }

    console.debug('Slideshow stopped');
  }
}

customElements.define('image-thumbnail', ImageThumbnail);
