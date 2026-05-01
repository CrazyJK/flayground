export default class NumberUtils {
  /**
   * 숫자를 천 단위로 구분하여 문자열로 반환합니다.
   * @param num - 변환할 숫자
   * @return 천 단위로 구분된 문자열
   */
  static formatWithCommas(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * 회계 형식으로 변환합니다.
   * @param num - 변환할 숫자
   * @return 회계 형식의 문자열
   */
  static formatAccounting(num: number): string {
    return num >= 0 ? this.formatWithCommas(num) : `(${this.formatWithCommas(-num)})`;
  }
}
