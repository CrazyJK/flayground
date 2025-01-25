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

/**
 * 모달 윈도우의 z-index를 증가하여 반환한다.
 * @returns {number} 증가된 z-index
 */
export const nextWindowzIndex = () => {
  if (!window.__zIndex__) {
    window.__zIndex__ = 13;
  }
  window.__zIndex__++;
  return window.__zIndex__;
};

/** 모달 윈도우의 모드 */
export const MODE = {
  NORMAL: 'normal',
  MINIMIZE: 'minimize',
  MAXIMIZE: 'maximize',
  TERMINATE: 'terminate',
};

/** 모달 윈도우의 가장자리 */
export const EDGE = {
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  CENTER: 'center',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
};
