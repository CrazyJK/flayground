/**
 * SCSS/CSS 모듈 타입 선언 (사이드 이펙트 임포트 지원)
 */
declare module '*.scss' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any;
  export = content;
}

/**
 * CSS 모듈 타입 선언
 */
declare module '*.css' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any;
  export = content;
}

/**
 * SVG 파일 타입 선언
 */
declare module '*.svg' {
  const content: string;
  export default content;
}
