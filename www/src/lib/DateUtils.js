export default class DateUtils {
  /**
   * 패턴에 맞게 날자 구하기
   * @param {number | string | Date} time 날자값
   * @param {string} pattern default yyyy-MM-dd HH:mm:ss
   * @returns
   */
  static format(time, pattern = 'yyyy-MM-dd HH:mm:ss') {
    if (time < 0) {
      return pattern.replace(/yyyy/gi, '0000').replace(/yy/gi, '00').replace(/MM/gi, '00').replace(/M/gi, '0').replace(/dd/gi, '00').replace(/d/gi, '0');
    } else {
      const date = this.getDate(time);
      const [year, month, day, hour, minute, second] = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
      return pattern
        .replace(/yyyy/g, year)
        .replace(/yy/g, year - 2000)
        .replace(/MM/g, twoDigit(month))
        .replace(/M/g, month)
        .replace(/dd/g, twoDigit(day))
        .replace(/d/g, day)
        .replace(/HH/g, twoDigit(hour))
        .replace(/H/g, hour)
        .replace(/mm/g, twoDigit(minute))
        .replace(/m/g, minute)
        .replace(/ss/g, twoDigit(second))
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
      case 'string':
        return new Date(value);
      default:
        return value;
    }
  }
}

function twoDigit(n) {
  return n > 9 ? n : '0' + n;
}
