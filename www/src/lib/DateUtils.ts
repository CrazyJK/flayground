export default class DateUtils {
  // 자주 사용하는 날짜 형식 상수
  static FORMATS = {
    DATE: 'yyyy-MM-dd',
    TIME: 'HH:mm:ss',
    DATETIME: 'yyyy-MM-dd HH:mm:ss',
    SIMPLE_DATE: 'yy-MM-dd',
    SIMPLE_TIME: 'HH:mm',
    MONTH: 'yyyy-MM',
    YEAR: 'yyyy',
  };

  /**
   * 패턴에 맞게 날자 구하기
   * @param time - 날자값
   * @param pattern - 기본값 yyyy-MM-dd HH:mm:ss
   * @returns 패턴에 맞게 포맷된 날짜 문자열
   */
  static format(time: number | string | Date = -1, pattern: string = this.FORMATS.DATETIME): string {
    if ((typeof time === 'number' && time < 0) || time === '') {
      return this.#getEmptyDatePattern(pattern);
    } else {
      const date = this.getDate(time);
      const [fullYear, year, month, day, hour, minute, second] = [date.getFullYear(), date.getFullYear() - 2000, date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];

      return pattern
        .replace(/yyyy/g, fullYear.toString())
        .replace(/yy/g, String(year).padStart(2, '0'))
        .replace(/MM/g, String(month).padStart(2, '0'))
        .replace(/M/g, month.toString())
        .replace(/dd/g, String(day).padStart(2, '0'))
        .replace(/d/g, day.toString())
        .replace(/HH/g, String(hour).padStart(2, '0'))
        .replace(/H/g, hour.toString())
        .replace(/mm/g, String(minute).padStart(2, '0'))
        .replace(/m/g, minute.toString())
        .replace(/ss/g, String(second).padStart(2, '0'))
        .replace(/s/g, second.toString());
    }
  }

  /**
   * 빈 날짜 패턴 생성
   * @private
   * @param pattern - 날짜 패턴
   * @returns 빈 날짜 패턴
   */
  static #getEmptyDatePattern(pattern: string): string {
    return pattern.replace(/yyyy/gi, '0000').replace(/yy/gi, '00').replace(/MM/gi, '00').replace(/M/gi, '0').replace(/dd/gi, '00').replace(/d/gi, '0').replace(/HH/g, '00').replace(/H/g, '0').replace(/mm/g, '00').replace(/m/g, '0').replace(/ss/g, '00').replace(/s/g, '0');
  }

  /**
   * 요일 반환
   * @param date - 날짜
   * @param locale - 로케일
   * @returns 요일 (예: '월')
   */
  static getDayOfWeek(date: number | string | Date, locale: string = 'ko-KR'): string {
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(this.getDate(date));
  }

  /**
   * 날짜 객체로 변환
   * @param value - 변환할 값
   * @returns 변환된 Date 객체
   */
  static getDate(value: number | string | Date = new Date()): Date {
    const type = typeof value;
    switch (type) {
      case 'number':
        return new Date(value as number);
      case 'string':
        return new Date(value as string);
      default:
        return value as Date;
    }
  }

  /**
   * 두 날짜 사이의 일수 계산
   * @param date1 - 첫 번째 날짜
   * @param date2 - 두 번째 날짜
   * @returns 두 날짜 사이의 일수
   */
  static daysBetween(date1: number | string | Date, date2: number | string | Date): number {
    const d1 = this.getDate(date1);
    const d2 = this.getDate(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * 날짜에 일수 더하기
   * @param date - 기준 날짜
   * @param days - 더할 일수 (음수도 가능)
   * @returns 계산된 날짜
   */
  static addDays(date: number | string | Date, days: number): Date {
    const result = this.getDate(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * 날짜에 개월수 더하기
   * @param date - 기준 날짜
   * @param months - 더할 개월수 (음수도 가능)
   * @returns 계산된 날짜
   */
  static addMonths(date: number | string | Date, months: number): Date {
    const result = this.getDate(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * 오늘 날짜인지 확인
   * @param date - 확인할 날짜
   * @returns 오늘 날짜이면 true
   */
  static isToday(date: number | string | Date): boolean {
    const d = this.getDate(date);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }
}
