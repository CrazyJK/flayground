export default class TimeUtils {
  /**
   * 초를 시:분:초 형식으로 구한다
   * @param {number} seconds
   * @returns
   */
  static toTime(seconds) {
    return new Date(seconds * 1000).toISOString().slice(11, 19);
  }
}
