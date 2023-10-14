export function dateFormat(time, pattern) {
  let ret = pattern;
  if (time < 0) {
    ret = ret.replace(/yyyy/gi, '0000');
    ret = ret.replace(/yy/gi, '00');
    ret = ret.replace(/mm/gi, '00');
    ret = ret.replace(/m/gi, '0');
    ret = ret.replace(/dd/gi, '00');
    ret = ret.replace(/d/gi, '0');
  } else {
    const date = new Date(time);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    ret = ret.replace(/yyyy/gi, year);
    ret = ret.replace(/yy/gi, year - 2000);
    ret = ret.replace(/mm/gi, month > 9 ? month : '0' + month);
    ret = ret.replace(/m/gi, month);
    ret = ret.replace(/dd/gi, day > 9 ? day : '0' + day);
    ret = ret.replace(/d/gi, day);
  }

  return ret;
}
