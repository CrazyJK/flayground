import { ImageCircle, type EffectType, type ImageCircleOptions } from '@image/ImageCircle';
import DateUtils from '@lib/DateUtils';
import './inc/Page';
import './index.scss';

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

console.info(`%c\n\tFlayground : ${process.env.NODE_ENV} : ${process.env.WATCH_MODE === 'true' ? 'Watch mode' : ''} 🕒 ${DateUtils.format(process.env.BUILD_TIME)}\n`, 'color: orange; font-size: 20px; font-weight: bold;');

/**
 * 주어진 요소에서 사용 가능한 rem 크기를 계산합니다.
 * @param element - 크기를 계산할 HTML 요소
 * @returns rem 단위로 계산된 사용 가능한 최소 크기
 */
function getAvailableRemSize(element: Element): number {
  /**
   * 요소의 사용 가능한 너비를 계산합니다.
   * @param element - 너비를 계산할 요소
   * @returns 패딩을 제외한 사용 가능한 너비 (px)
   */
  function getAvailableWidth(element: Element): number {
    const computedStyle = getComputedStyle(element);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const paddingRight = parseFloat(computedStyle.paddingRight);

    return window.innerWidth - paddingLeft - paddingRight;
  }

  /**
   * 요소의 사용 가능한 높이를 계산합니다.
   * @param element - 높이를 계산할 요소
   * @returns 패딩을 제외한 사용 가능한 높이 (px)
   */
  function getAvailableHeight(element: Element): number {
    const computedStyle = getComputedStyle(element);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);

    return window.innerHeight - paddingTop - paddingBottom;
  }

  /**
   * px 값을 rem 값으로 변환합니다.
   * @param px - 변환할 픽셀 값
   * @returns rem 단위로 변환된 값
   */
  function pxToRem(px: number): number {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return Math.floor(px / rem);
  }

  const width = getAvailableWidth(element);
  const height = getAvailableHeight(element);
  return Math.min(pxToRem(width), pxToRem(height));
}
