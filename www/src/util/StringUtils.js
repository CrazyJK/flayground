export default class StringUtils {
  /**
   *
   * @param {string?} text
   * @returns
   */
  static isBlank(text) {
    return typeof text === 'undefined' || text === null || text.trim() === '';
  }
}
