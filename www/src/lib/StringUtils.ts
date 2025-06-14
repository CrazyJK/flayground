// 널러블 문자열 타입 정의
type NullableString = string | null | undefined;

export default class StringUtils {
  /**
   * 값이 없거나, 빈값, 공백뿐인지 확인
   * @param text - 확인할 텍스트
   * @returns 비어있으면 true, 아니면 false
   */
  static isBlank(text: NullableString): boolean {
    if (text === null) return true;
    if (typeof text === 'undefined') return true;
    if (typeof text !== 'string') return false;
    return text.trim() === '';
  }

  /**
   * blank라면, def 반환
   * @param text - 확인할 텍스트
   * @param def - 기본값 (생략되면 빈값(''))
   * @returns 텍스트가 blank가 아니면 원본, blank이면 기본값
   */
  static toBlank(text: NullableString, def = ''): string {
    return this.isBlank(text) ? def : (text as string);
  }

  /**
   * 문자열을 특정 길이로 자름. 초과 시 끝에 ellipsis 추가
   * @param text - 원본 문자열
   * @param maxLength - 최대 길이
   * @param ellipsis - 생략 부호 (기본값: '...')
   * @returns 조정된 문자열
   */
  static truncate(text: NullableString, maxLength: number, ellipsis: string = '...'): string {
    if (this.isBlank(text)) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
  }

  /**
   * 문자열의 첫 글자를 대문자로 변환
   * @param text - 원본 문자열
   * @returns 첫 글자가 대문자인 문자열
   */
  static capitalize(text: NullableString): string {
    if (this.isBlank(text)) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * 지정된 문자가 문자열에 몇 번 등장하는지 계산
   * @param text - 원본 문자열
   * @param char - 찾을 문자
   * @returns 등장 횟수
   */
  static countOccurrences(text: NullableString, char: NullableString): number {
    if (this.isBlank(text) || this.isBlank(char)) return 0;
    return text.split(char).length - 1;
  }

  /**
   * 문자열에서 HTML 태그 제거
   * @param html - HTML 문자열
   * @returns HTML 태그가 제거된 문자열
   */
  static stripHtml(html: NullableString): string {
    if (this.isBlank(html)) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * 두 문자열이 동일한지 비교 (대소문자 무시)
   * @param text1 - 첫 번째 문자열
   * @param text2 - 두 번째 문자열
   * @returns 동일하면 true, 다르면 false
   */
  static equalsIgnoreCase(text1: NullableString, text2: NullableString): boolean {
    if (text1 === text2) return true;
    if (text1 === null || text2 === null) return false;
    if (typeof text1 !== 'string' || typeof text2 !== 'string') return false;
    return text1.toLowerCase() === text2.toLowerCase();
  }

  /**
   * 숫자를 포맷팅된 문자열로 변환
   * @param num - 포맷팅할 숫자
   * @param locale - 로케일 (기본값: 'ko-KR')
   * @returns 포맷팅된 문자열 (숫자가 유효하지 않으면 빈 문자열)
   */
  static formatNumber(num: number, locale = 'ko-KR'): string {
    if (typeof num !== 'number' || isNaN(num)) return '';
    return num.toLocaleString(locale);
  }
}
