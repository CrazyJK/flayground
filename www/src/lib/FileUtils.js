export const KB = 1024;
export const MB = KB * 1024;
export const GB = MB * 1024;
export const TB = GB * 1024;

/**
 * 파일 크기 관련 유틸리티 클래스
 */
export default class FileUtils {
  /**
   * 파일 크기를 사람이 읽기 쉬운 형태로 변환합니다.
   * @param {number} length 파일 크기 (바이트 단위)
   * @param {string} [unit] 강제로 사용할 단위 ('TB', 'GB', 'MB', 'KB', 'B')
   * @returns {[string, string]} [크기, 단위] 형태의 배열
   * @throws {Error} 유효하지 않은 크기를 전달했을 경우
   */
  static prettySize(length, unit) {
    // 유효성 검사
    if (length === undefined || length === null || isNaN(length)) {
      throw new Error('유효한 파일 크기를 입력해주세요.');
    }

    if (unit) {
      // 단위가 지정된 경우
      switch (unit.toUpperCase()) {
        case 'TB':
          return this.tb(length);
        case 'GB':
          return this.gb(length);
        case 'MB':
          return this.mb(length);
        case 'KB':
          return this.kb(length);
        case 'B':
          return this.b(length);
        default:
          console.warn(`지원하지 않는 단위입니다: ${unit}, 바이트(B)로 표시합니다.`);
          return this.b(length);
      }
    } else {
      // 크기에 맞는 최적의 단위 선택
      if (length >= TB) return this.tb(length);
      if (length >= GB) return this.gb(length);
      if (length >= MB) return this.mb(length);
      if (length >= KB) return this.kb(length);
      return this.b(length);
    }
  }

  /**
   * 바이트를 테라바이트 단위로 변환합니다.
   * @param {number} length 파일 크기 (바이트 단위)
   * @returns {[string, string]} [크기, 단위] 형태의 배열
   */
  static tb(length) {
    return [(length / TB).toFixed(2), 'TB'];
  }

  /**
   * 바이트를 기가바이트 단위로 변환합니다.
   * @param {number} length 파일 크기 (바이트 단위)
   * @returns {[string, string]} [크기, 단위] 형태의 배열
   */
  static gb(length) {
    return [(length / GB).toFixed(1), 'GB'];
  }

  /**
   * 바이트를 메가바이트 단위로 변환합니다.
   * @param {number} length 파일 크기 (바이트 단위)
   * @returns {[string, string]} [크기, 단위] 형태의 배열
   */
  static mb(length) {
    return [(length / MB).toFixed(0), 'MB'];
  }

  /**
   * 바이트를 킬로바이트 단위로 변환합니다.
   * @param {number} length 파일 크기 (바이트 단위)
   * @returns {[string, string]} [크기, 단위] 형태의 배열
   */
  static kb(length) {
    return [(length / KB).toFixed(0), 'KB'];
  }

  /**
   * 바이트 단위로 표시합니다.
   * @param {number} length 파일 크기 (바이트 단위)
   * @returns {[string, string]} [크기, 단위] 형태의 배열
   */
  static b(length) {
    return [length.toFixed(0), 'B'];
  }

  /**
   * 파일 크기를 포맷팅하여 문자열로 반환합니다.
   * @param {number} length 파일 크기 (바이트 단위)
   * @param {string} [unit] 강제로 사용할 단위 ('TB', 'GB', 'MB', 'KB', 'B')
   * @returns {string} "100 MB" 형태의 문자열
   */
  static formatSize(length, unit) {
    const [size, unitText] = this.prettySize(length, unit);
    return `${size} ${unitText}`;
  }
}
