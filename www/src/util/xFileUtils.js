export const KB = 1024;
export const MB = KB * 1024;
export const GB = MB * 1024;
export const TB = GB * 1024;

export default class FileUtils {
  /**
   *
   * @param {number} length file length
   * @param {string?} unit file unit [TB, GB, MB, KB, B]
   * @returns [size, unit]
   */
  static prettySize(length, unit) {
    if (unit) {
      switch (unit) {
        case 'TB':
          return this.tb(length);
        case 'GB':
          return this.gb(length);
        case 'MB':
          return this.mb(length);
        case 'KB':
          return this.kb(length);
        default:
          return this.b(length);
      }
    } else {
      if (length > TB) return this.tb(length);
      if (length > GB) return this.gb(length);
      if (length > MB) return this.mb(length);
      if (length > KB) return this.kb(length);
      return this.b(length);
    }
  }

  static tb(length) {
    return [(length / TB).toFixed(2), 'TB'];
  }
  static gb(length) {
    return [(length / GB).toFixed(1), 'GB'];
  }
  static mb(length) {
    return [(length / MB).toFixed(0), 'MB'];
  }
  static kb(length) {
    return [(length / KB).toFixed(0), 'KB'];
  }
  static b(length) {
    return [length.toFixed(0), 'B'];
  }
}
