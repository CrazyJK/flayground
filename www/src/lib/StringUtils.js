export default class StringUtils {
  /**
   * 값이 없거나, 빈값, 공백뿐인지
   * @param {string} text
   * @returns {boolean} 비어있으면 true
   */
  static isBlank(text) {
    if (text === null) return true;
    if (typeof text === 'undefined') return true;
    if (typeof text !== 'string') return false;
    return text.trim() === '';
  }

  /**
   * blank라면, def 반환
   * @param {string} text
   * @param {string} def 생략되면 빈값('')
   * @returns {string}
   */
  static toBlank(text, def = '') {
    return this.isBlank(text) ? def : text;
  }

  /**
   * 문자열을 특정 길이로 자름. 초과 시 끝에 ellipsis 추가
   * @param {string} text 원본 문자열
   * @param {number} maxLength 최대 길이
   * @param {string} ellipsis 생략 부호 (기본값: '...')
   * @returns {string} 조정된 문자열
   */
  static truncate(text, maxLength, ellipsis = '...') {
    if (this.isBlank(text)) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
  }

  /**
   * 문자열의 첫 글자를 대문자로 변환
   * @param {string} text 원본 문자열
   * @returns {string} 첫 글자가 대문자인 문자열
   */
  static capitalize(text) {
    if (this.isBlank(text)) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * 지정된 문자가 문자열에 몇 번 등장하는지 계산
   * @param {string} text 원본 문자열
   * @param {string} char 찾을 문자
   * @returns {number} 등장 횟수
   */
  static countOccurrences(text, char) {
    if (this.isBlank(text) || this.isBlank(char)) return 0;
    return text.split(char).length - 1;
  }

  /**
   * 문자열에서 HTML 태그 제거
   * @param {string} html HTML 문자열
   * @returns {string} HTML 태그가 제거된 문자열
   */
  static stripHtml(html) {
    if (this.isBlank(html)) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * 두 문자열이 동일한지 비교 (대소문자 무시)
   * @param {string} text1 첫 번째 문자열
   * @param {string} text2 두 번째 문자열
   * @returns {boolean} 동일하면 true
   */
  static equalsIgnoreCase(text1, text2) {
    if (text1 === text2) return true;
    if (text1 === null || text2 === null) return false;
    if (typeof text1 !== 'string' || typeof text2 !== 'string') return false;
    return text1.toLowerCase() === text2.toLowerCase();
  }

  /**
   * 숫자를 포맷팅된 문자열로 변환
   * @param {number} num 숫자
   * @param {string} locale 로케일 (기본값: 'ko-KR')
   * @returns {string} 포맷팅된 문자열
   */
  static formatNumber(num, locale = 'ko-KR') {
    if (typeof num !== 'number' || isNaN(num)) return '';
    return num.toLocaleString(locale);
  }
}
