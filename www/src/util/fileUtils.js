const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
const TB = GB * 1024;

/**
 *
 * @param {number} length
 * @returns [size, unit]
 */
export function getPrettyFilesize(length) {
  if (length > TB) return [(length / TB).toFixed(1), 'TB'];
  if (length > GB) return [(length / GB).toFixed(1), 'GB'];
  if (length > MB) return [(length / MB).toFixed(0), 'MB'];
  if (length > KB) return [(length / KB).toFixed(0), 'KB'];
  return [length.toFixed(0), 'B'];
}
