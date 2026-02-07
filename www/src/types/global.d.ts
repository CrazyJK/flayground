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

/**
 * webpack DefinePlugin으로 정의된 환경 변수 타입 선언
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** 빌드 환경 (development | production) */
    readonly NODE_ENV: 'development' | 'production';
    /** 빌드 시간 (ISO 8601 형식) */
    readonly BUILD_TIME: string;
    /** watch 모드 여부 */
    readonly WATCH_MODE: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
