export default class StringUtils {
  /**
   * 값이 없거나, 빈값, 공백뿐인지
   * @param {string} text
   * @returns
   */
  static isBlank(text) {
    if (typeof text !== 'string') return false;
    return typeof text === 'undefined' || text === null || text.trim() === '';
  }

  /**
   * blank라면, def 반환
   * @param {string} text
   * @param {string} def 생략되면 빈값('')
   * @returns
   */
  static toBlank(text, def = '') {
    return this.isBlank(text) ? def : text;
  }
}
