const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
const TB = GB * 1024;

/**
 *
 * @param {number} length file length
 * @param {string} unit file unit [TB, GB, MB, KB, B]
 * @returns [size, unit]
 */
export function getPrettyFilesize(length, unit) {
  if (unit) {
    switch (unit) {
      case 'TB':
        return tb(length);
      case 'GB':
        return gb(length);
      case 'MB':
        return mb(length);
      case 'KB':
        return kb(length);
      default:
        return b(length);
    }
  } else {
    if (length > TB) return tb(length);
    if (length > GB) return gb(length);
    if (length > MB) return mb(length);
    if (length > KB) return kb(length);
    return b(length);
  }
}

function tb(length) {
  return [(length / TB).toFixed(2), 'TB'];
}
function gb(length) {
  return [(length / GB).toFixed(1), 'GB'];
}
function mb(length) {
  return [(length / MB).toFixed(0), 'MB'];
}
function kb(length) {
  return [(length / KB).toFixed(0), 'KB'];
}
function b(length) {
  return [length.toFixed(0), 'B'];
}
