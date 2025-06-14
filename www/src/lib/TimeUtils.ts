export default class TimeUtils {
  /**
   * 초를 시:분:초 형식으로 구한다
   * @param seconds - 변환할 초 단위 시간
   * @returns HH:MM:SS 형식의 시간 문자열
   */
  static toTime(seconds: number): string {
    return new Date(seconds * 1000).toISOString().slice(11, 19);
  }
}
