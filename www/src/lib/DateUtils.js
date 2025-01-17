export default class DateUtils {
  /**
   * 패턴에 맞게 날자 구하기
   * @param {number | string | Date} time 날자값
   * @param {string} pattern default yyyy-MM-dd HH:mm:ss
   * @returns
   */
  static format(time = -1, pattern = 'yyyy-MM-dd HH:mm:ss') {
    if (time < 0 || time === '') {
      return pattern.replace(/yyyy/gi, '0000').replace(/yy/gi, '00').replace(/MM/gi, '00').replace(/M/gi, '0').replace(/dd/gi, '00').replace(/d/gi, '0').replace(/HH/g, '00').replace(/H/g, '0').replace(/mm/g, '00').replace(/m/g, '0').replace(/ss/g, '00').replace(/s/g, '0');
    } else {
      const date = this.getDate(time);
      const [fullYear, year, month, day, hour, minute, second] = [date.getFullYear(), date.getFullYear() - 2000, date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
      return pattern
        .replace(/yyyy/g, fullYear)
        .replace(/yy/g, String(year).padStart(2, '0'))
        .replace(/MM/g, String(month).padStart(2, '0'))
        .replace(/M/g, month)
        .replace(/dd/g, String(day).padStart(2, '0'))
        .replace(/d/g, day)
        .replace(/HH/g, String(hour).padStart(2, '0'))
        .replace(/H/g, hour)
        .replace(/mm/g, String(minute).padStart(2, '0'))
        .replace(/m/g, minute)
        .replace(/ss/g, String(second).padStart(2, '0'))
        .replace(/s/g, second);
    }
  }

  /**
   * 요일 반환
   * @param {number | string | Date} date
   * @returns
   */
  static getDayOfWeek(date) {
    return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(this.getDate(date));
  }

  static getDate(value = new Date()) {
    const type = typeof value;
    switch (type) {
      case 'number':
        return new Date(value);
      case 'string':
        return new Date(value);
      default:
        return value;
    }
  }
}
