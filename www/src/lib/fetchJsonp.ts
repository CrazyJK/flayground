/**
 * JSONP (JSON with Padding) 유틸리티
 *
 * Cross-Origin 요청을 위한 JSONP 방식의 데이터 fetching 기능을 제공합니다.
 * 동적으로 script 태그를 생성하여 외부 도메인의 JSON 데이터를 가져옵니다.
 *
 * 특징:
 * - Cross-Origin 제약 없이 외부 API 호출
 * - 동적 콜백 함수 생성 및 정리
 * - Promise 기반 비동기 처리
 * - 에러 처리 및 타임아웃 지원
 * - 타입 안전한 API 제공
 *
 * @author kamoru
 * @since 2024
 */

/** JSONP 콜백 함수 타입 */
type JsonpCallback<T = unknown> = (data: T) => void;

/** JSONP 옵션 인터페이스 */
interface JsonpOptions {
  /** 콜백 함수 이름 (선택사항, 자동 생성됨) */
  callbackName?: string;
  /** 타임아웃 시간 (밀리초, 기본값: 10000) */
  timeout?: number;
  /** URL 매개변수 이름 (기본값: 'callback') */
  callbackParam?: string;
}

/** 확장된 Window 인터페이스 */
declare global {
  interface Window {
    [key: string]: JsonpCallback | undefined;
  }
}

/**
 * 주어진 URL에서 JSONP 데이터를 가져옵니다.
 *
 * @param url JSONP 데이터를 가져올 URL
 * @param options JSONP 요청 옵션
 * @returns JSONP 데이터로 해결되거나 오류로 거부되는 Promise
 */
function fetchJsonp<T = unknown>(url: string, options: JsonpOptions = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const { callbackName, timeout = 10000, callbackParam = 'callback' } = options;

    const script = document.createElement('script');
    const callbackFunctionName = callbackName || `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // 정리 함수
    const cleanup = (): void => {
      if (window[callbackFunctionName]) {
        delete window[callbackFunctionName];
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // 콜백 함수 등록
    window[callbackFunctionName] = (data: T): void => {
      cleanup();
      resolve(data);
    };

    // 스크립트 로드 실패 처리
    script.onerror = (): void => {
      cleanup();
      reject(new Error(`JSONP request failed for URL: ${url}`));
    };

    // 타임아웃 처리
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`JSONP request timed out after ${timeout}ms for URL: ${url}`));
      }, timeout);
    }

    // URL에 콜백 매개변수 추가
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}${callbackParam}=${callbackFunctionName}`;

    // 스크립트 삽입으로 요청 시작
    document.body.appendChild(script);
  });
}

export default fetchJsonp;
