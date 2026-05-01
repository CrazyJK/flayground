/**
 * 스타일 관련 유틸리티 클래스
 * CSS 단위 변환 및 요소 크기 계산을 위한 헬퍼 메서드들을 제공합니다.
 */
export default class StyleUtils {
  /**
   * rem 단위를 px 단위로 변환합니다.
   * @param rem - 변환할 rem 값
   * @returns px 단위로 변환된 값
   * @example
   * StyleUtils.remToPx(1.5) // 24 (기본 폰트 크기가 16px인 경우)
   */
  static remToPx(rem: number): number {
    return rem * this.getRootFontSize();
  }

  /**
   * px 단위를 rem 단위로 변환합니다.
   * @param px - 변환할 px 값
   * @returns rem 단위로 변환된 값
   * @example
   * StyleUtils.pxToRem(32) // 2 (기본 폰트 크기가 16px인 경우)
   */
  static pxToRem(px: number): number {
    return px / this.getRootFontSize();
  }

  /**
   * 요소의 사용 가능한 높이를 px 단위로 계산합니다.
   * 전체 화면 높이에서 요소의 상하 패딩을 뺀 값을 반환합니다.
   * @param element - 계산할 요소
   * @returns px 단위의 사용 가능한 높이
   */
  static getAvailableHeightInPx(element: Element): number {
    const computedStyle = getComputedStyle(element);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);

    return window.innerHeight - paddingTop - paddingBottom;
  }

  /**
   * 요소의 사용 가능한 너비를 px 단위로 계산합니다.
   * 전체 화면 너비에서 요소의 좌우 패딩을 뺀 값을 반환합니다.
   * @param element - 계산할 요소
   * @returns px 단위의 사용 가능한 너비
   */
  static getAvailableWidthInPx(element: Element): number {
    const computedStyle = getComputedStyle(element);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const paddingRight = parseFloat(computedStyle.paddingRight);

    return window.innerWidth - paddingLeft - paddingRight;
  }

  /**
   * 요소의 사용 가능한 너비를 rem 단위로 계산합니다.
   * 전체 화면 너비에서 요소의 좌우 패딩을 뺀 값을 rem으로 변환하여 반환합니다.
   * @param element - 계산할 요소
   * @returns rem 단위의 사용 가능한 너비
   */
  static getAvailableWidthInRem(element: Element): number {
    const availableWidthPx = this.getAvailableWidthInPx(element);
    return this.pxToRem(availableWidthPx);
  }

  /**
   * 요소의 사용 가능한 높이를 rem 단위로 계산합니다.
   * 전체 화면 높이에서 요소의 상하 패딩을 뺀 값을 rem으로 변환하여 반환합니다.
   * @param element - 계산할 요소
   * @returns rem 단위의 사용 가능한 높이
   */
  static getAvailableHeightInRem(element: Element): number {
    const availableHeightPx = this.getAvailableHeightInPx(element);
    return this.pxToRem(availableHeightPx);
  }

  /**
   * 루트 요소의 폰트 크기를 가져옵니다.
   * @returns 루트 폰트 크기 (px)
   */
  static getRootFontSize(): number {
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  /**
   * 요소의 실제 크기 정보를 가져옵니다.
   * @param element - 크기를 측정할 요소
   * @returns 요소의 크기 정보 (px 단위)
   */
  static getElementSize(element: Element): { width: number; height: number; paddingLeft: number; paddingRight: number; paddingTop: number; paddingBottom: number } {
    const computedStyle = getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return {
      width: rect.width,
      height: rect.height,
      paddingLeft: parseFloat(computedStyle.paddingLeft),
      paddingRight: parseFloat(computedStyle.paddingRight),
      paddingTop: parseFloat(computedStyle.paddingTop),
      paddingBottom: parseFloat(computedStyle.paddingBottom),
    };
  }

  /**
   * CSS 스타일을 동적으로 추가하는 유틸리티 함수
   * @param styles - 추가할 CSS 스타일 문자열
   * @param id - 스타일 요소의 고유 ID
   */
  static addStyle(styles: string, id: string): void {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    styleElement.id = id;
    document.head.appendChild(styleElement);
  }

  /**
   *  CSS 스타일을 동적으로 제거하는 유틸리티 함수
   * @param id - 스타일 요소의 고유 ID
   */
  static removeStyle(id: string): void {
    const styleElements = document.head.querySelectorAll(`style#${id}`);
    for (const styleElement of styleElements) {
      document.head.removeChild(styleElement);
    }
  }

  /**
   * 요소의 크기가 landscape, portrait 중 어떤 방향에 맞춰져 있는지 판단
   */
  static getOrientation(element: Element): 'landscape' | 'portrait' {
    const { width, height } = this.getElementSize(element);
    return width >= height ? 'landscape' : 'portrait';
  }
}
