/**
 * Ground 프로젝트에서 사용하는 공통 상수들
 * - 이벤트 이름 상수
 * - 모달 윈도우 관련 상수
 * - 키보드 이벤트 코드 상수
 * - z-index 관리 유틸리티
 */

/** 타이틀 변경 요청 이벤트 */
export const EVENT_CHANGE_TITLE = 'changeTitle';

/** 에디터 로드 이벤트 */
export const EVENT_EDITOR_LOAD = 'editor-load';
/** 에디터를 벗어나는 이벤트 */
export const EVENT_EDITOR_BLUR = 'editor-blur';
/** 에디터 내용이 변결되는 이벤트 */
export const EVENT_EDITOR_CHANGE = 'editor-change';

/** 바스켓에 flay 추가 이벤트 */
export const EVENT_BASKET_ADD = 'basket-add';

// Window 인터페이스 확장 - __zIndex__ 프로퍼티 추가
declare global {
  interface Window {
    __zIndex__: number;
  }
}

window.__zIndex__ = 13;

/**
 * 모달 윈도우의 z-index를 증가하여 반환한다.
 * @returns {number} 증가된 z-index
 */
export const nextWindowzIndex = (): number => ++window.__zIndex__;

/** 모달 윈도우의 모드 */
export const MODAL_MODE = {
  NORMAL: 'normal',
  MINIMIZE: 'minimize',
  MAXIMIZE: 'maximize',
  TERMINATE: 'terminate',
} as const;

/** 모달 윈도우 모드 타입 */
export type ModalMode = (typeof MODAL_MODE)[keyof typeof MODAL_MODE];

/** 모달 윈도우의 가장자리 */
export const MODAL_EDGE = {
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  CENTER: 'center',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
} as const;

/** 모달 윈도우 가장자리 타입 */
export type ModalEdge = (typeof MODAL_EDGE)[keyof typeof MODAL_EDGE];

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
  WHEEL_DOWN: 'WheelDown',
  WHEEL_UP: 'WheelUp',
} as const;

/** 이벤트 코드 타입 */
export type EventCodeType = (typeof EventCode)[keyof typeof EventCode];
