/**
 * Ground 프로젝트에서 사용하는 공통 상수들
 * - 키보드 이벤트 코드 상수
 * - z-index 관리 유틸리티
 */

// Window 인터페이스 확장 - __zIndex__ 프로퍼티 추가
declare global {
  interface Window {
    __zIndex__: number;
  }
}

window.__zIndex__ = 13;

/**
 * 모달 윈도우의 z-index를 증가하여 반환한다.
 * @returns 증가된 z-index
 */
export const nextWindowzIndex = (): number => ++window.__zIndex__;

/** 키보드 이벤트 코드 상수 */
export const EventCode = {
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',
  END: 'End',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  HOME: 'Home',
  INSERT: 'Insert',
  PAGE_DOWN: 'PageDown',
  PAGE_UP: 'PageUp',
  SPACE: 'Space',
  TAB: 'Tab',
  KEY_R: 'KeyR',
  WHEEL_DOWN: 'WheelDown',
  WHEEL_UP: 'WheelUp',
} as const;

/** 이벤트 코드 타입 */
export type EventCodeType = (typeof EventCode)[keyof typeof EventCode];
