export default class StyleUtils {
  static remToPx(rem: number): number {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return rem * rootFontSize;
  }

  static pxToRem(px: number): number {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return px / rootFontSize;
  }

  static getAvailableRemSize(element: Element): number {
    const computedStyle = getComputedStyle(element);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const paddingRight = parseFloat(computedStyle.paddingRight);

    return window.innerWidth - paddingLeft - paddingRight;
  }

  static getAvailableHeight(element: Element): number {
    const computedStyle = getComputedStyle(element);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);

    return window.innerHeight - paddingTop - paddingBottom;
  }
}
