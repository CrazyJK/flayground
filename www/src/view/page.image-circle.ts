import { ImageCircle, type EffectType, type ImageCircleOptions } from '@image/ImageCircle';
import StyleUtils from '../lib/StyleUtils';
import './inc/Page';
import './page.image-circle.scss';

/**
 * 메인 페이지 클래스
 * ImageCircle 컴포넌트를 관리하고 키보드 및 윈도우 이벤트를 처리합니다.
 */
class Page {
  /**
   * 페이지 초기화 및 ImageCircle 컴포넌트 설정
   */
  async start(): Promise<void> {
    const mainElement = document.querySelector('body > main') as HTMLElement;

    // ImageCircle 옵션 상수 정의 (정적 임포트한 타입들 사용)
    const SMALL_MODE_OPTIONS: Partial<ImageCircleOptions> = {
      rem: 10,
      effect: ImageCircle.effectTypes.engrave as EffectType,
      duration: 2000,
      eventAllow: false,
    };

    const FULL_MODE_OPTIONS = (remSize: number): Partial<ImageCircleOptions> => ({
      rem: remSize,
      effect: ImageCircle.effectTypes.emboss as EffectType,
      duration: 3000,
      eventAllow: true,
    });

    // ImageCircle 인스턴스 생성 및 설정
    const imageCircle = new ImageCircle(SMALL_MODE_OPTIONS);
    imageCircle.classList.toggle('right-bottom');
    mainElement.appendChild(imageCircle);

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      imageCircle.classList.toggle('right-bottom', e.key === 'ArrowDown');
      window.dispatchEvent(new Event('resize'));
    });

    window.addEventListener('resize', () => {
      imageCircle.setOptions(imageCircle.classList.contains('right-bottom') ? SMALL_MODE_OPTIONS : FULL_MODE_OPTIONS(getAvailableRemSize(mainElement)));
    });
  }
}

new Page().start();

/**
 * 주어진 요소에서 사용 가능한 rem 크기를 계산합니다.
 * @param element - 크기를 계산할 HTML 요소
 * @returns rem 단위로 계산된 사용 가능한 최소 크기
 */
function getAvailableRemSize(element: Element): number {
  const width = StyleUtils.getAvailableRemSize(element);
  const height = StyleUtils.getAvailableHeight(element);
  return Math.min(Math.floor(StyleUtils.pxToRem(width)), Math.floor(StyleUtils.pxToRem(height)));
}
