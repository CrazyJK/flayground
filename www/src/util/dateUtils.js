/**
 * 패턴에 맞게 날자 구하기
 * @param {number | string | Date} time 날자값
 * @param {string} pattern
 * @returns
 */
export function dateFormat(time, pattern) {
  if (time < 0) {
    return pattern.replace(/yyyy/gi, '0000').replace(/yy/gi, '00').replace(/mm/gi, '00').replace(/m/gi, '0').replace(/dd/gi, '00').replace(/d/gi, '0');
  } else {
    const date = getDate(time);
    const [year, month, day] = [date.getFullYear(), date.getMonth() + 1, date.getDate()];

    return pattern
      .replace(/yyyy/gi, year)
      .replace(/yy/gi, year - 2000)
      .replace(/mm/gi, month > 9 ? month : '0' + month)
      .replace(/m/gi, month)
      .replace(/dd/gi, day > 9 ? day : '0' + day)
      .replace(/d/gi, day);
  }
}

/**
 * 요일 반환
 * @param {number | string | Date} date
 * @returns
 */
export function getDayOfWeek(date) {
  return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(getDate(date));
}

function getDate(value = new Date()) {
  const type = typeof value;
  switch (type) {
    case 'number':
    case 'string':
      return new Date(value);
    default:
      return value;
  }
}
