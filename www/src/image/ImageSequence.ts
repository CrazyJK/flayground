import FlayFetch from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import './ImageSequence.scss';
import FlayImage from './part/FlayImage';

export class ImageSequence extends HTMLElement {
  private header: HTMLDivElement;
  private footer: HTMLDivElement;
  private imageLength: number = 0;
  private startIndex: number = 0;
  private offset: number = 0;
  private isActive: boolean = true; // 무한 루프 제어용

  constructor() {
    super();

    this.innerHTML = `
      <header></header>
      <main></main>
      <footer></footer>
    `;

    this.header = this.querySelector('header') as HTMLDivElement;
    this.footer = this.querySelector('footer') as HTMLDivElement;
  }

  connectedCallback(): void {
    this.isActive = true;
    this.start();
    window.addEventListener('resize', this.resizeHandler.bind(this));
  }

  disconnectedCallback(): void {
    // 정리 작업: 이미지 요소들의 메모리 정리
    this.isActive = false; // 무한 루프 중지
    this.cleanupImages();
    window.removeEventListener('resize', this.resizeHandler.bind(this));
  }

  async start(): Promise<void> {
    this.imageLength = await FlayFetch.getImageSize();
    this.startIndex = RandomUtils.getRandomInt(0, this.imageLength);
    this.offset = 0;

    await this.addImage();
    await this.changeImage();
  }

  async resizeHandler(): Promise<void> {
    console.log('Resize event triggered in ImageSequence component', this.isActive);
    // 리사이즈 이벤트 핸들러
    if (!this.isActive) return; // 컴포넌트가 비활성화되면 중지
    await this.start();
  }

  private getImage(index: number): FlayImage {
    const img = new FlayImage({ magnifier: false });
    img.dataset.idx = index.toString();
    return img;
  }

  private imageAnimate(image: FlayImage, toggle: boolean, duration: number = 1000): Promise<void> {
    const hideOpacity = 0.25;
    const keyframes = toggle ? [{ opacity: hideOpacity }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: hideOpacity }];

    return new Promise((resolve) => {
      const animation = image.animate(keyframes, {
        duration,
        easing: 'ease-in-out',
        fill: 'forwards', // 애니메이션 완료 후 최종 상태 유지
      });

      animation.onfinish = () => resolve();
      animation.oncancel = () => resolve(); // 애니메이션이 취소되어도 resolve
    });
  }

  private cleanupImages(): void {
    // 기존 이미지 요소들 정리
    this.header.innerHTML = '';
    this.footer.innerHTML = '';
  }

  private getValidIndex(index: number): number {
    // 인덱스를 유효 범위로 정규화 (모듈로 연산 사용)
    return ((index % this.imageLength) + this.imageLength) % this.imageLength;
  }

  private async addImage(): Promise<void> {
    // 기존 이미지들 정리 (메모리 누수 방지)
    this.cleanupImages();

    let showCondition = true;
    do {
      // 인덱스 계산 최적화
      const headerIndex = this.getValidIndex(this.startIndex - this.offset);
      const footerIndex = this.getValidIndex(this.startIndex + this.offset);

      const imageOfHeader = this.getImage(headerIndex);
      const imageOfFooter = this.getImage(footerIndex);
      this.header.prepend(imageOfHeader);
      this.footer.append(imageOfFooter);

      await Promise.all([this.imageAnimate(imageOfHeader, true), this.imageAnimate(imageOfFooter, true)]);

      const { right } = imageOfFooter.getBoundingClientRect();
      showCondition = this.clientWidth > right;

      this.offset++;
    } while (showCondition && this.isActive);
  }

  private async changeImage(): Promise<void> {
    const headerImages = Array.from(this.querySelectorAll('header > flay-image')) as FlayImage[];
    const footerImages = Array.from(this.querySelectorAll('footer > flay-image')) as FlayImage[];
    const columnCount = footerImages.length;
    let columnIndex = 0;

    let loopCondition = columnCount > 0 && this.isActive;
    do {
      if (!this.isActive) break; // 컴포넌트가 비활성화되면 중지

      const index = columnIndex++ % columnCount;
      const backIndex = columnCount - index - 1;

      const imageOfHeader = headerImages[backIndex];
      const imageOfFooter = footerImages[index];

      imageOfHeader.classList.add('current');
      imageOfFooter.classList.add('current');

      await Promise.all([this.imageAnimate(imageOfHeader, false, 300), this.imageAnimate(imageOfFooter, false, 300)]);
      imageOfHeader.dataset.idx = this.getValidIndex(this.startIndex - this.offset).toString();
      imageOfFooter.dataset.idx = this.getValidIndex(this.startIndex + this.offset).toString();
      await Promise.all([this.imageAnimate(imageOfHeader, true, 700), this.imageAnimate(imageOfFooter, true, 700)]);

      imageOfHeader.classList.remove('current');
      imageOfFooter.classList.remove('current');

      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms 대기
      this.offset++;

      // offset이 너무 커지면 리셋 (메모리 효율성)
      if (this.offset >= this.imageLength) {
        this.offset = 0;
        this.startIndex = RandomUtils.getRandomInt(0, this.imageLength);
      }
    } while (loopCondition && this.isActive);
  }
}

customElements.define('image-sequence', ImageSequence);
