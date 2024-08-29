const resizeListeners = [];
const beforeunloadListeners = [];
const loadListeners = [];
const mouseoutListeners = [];
const mouseoutToNullListeners = [];
const visibleListeners = [];
const hiddenListeners = [];

const RESIZE_DELAY = 300;
const VISIBLE_DELAY = 300;

let resizeTimer;
let visibleTimer;

/**
 * window load 이벤트 등록
 * @param {Function} listener
 */
export const addLoadListener = (listener) => {
  loadListeners.push(listener);
};

/**
 * window beforeunload 이벤트 등록
 * @param {Function} listener
 */
export const addBeforeunloadListener = (listener) => {
  beforeunloadListeners.push(listener);
};

/**
 * window mouseout 이벤트 등록
 * @param {Function} listener
 */
export const addMouseoutListener = (listener) => {
  mouseoutListeners.push(listener);
};

/**
 * 마우스가 화면 밖으로 나간 이벤트 등록
 * @param {Function} listener
 */
export const addMouseoutToNullListener = (listener) => {
  mouseoutToNullListeners.push(listener);
};

/**
 * window resize 이벤트 핸들러를 등록한다.
 * - 등록 즉시 1회 수행한다
 * @param {Function} listener
 */
export const addResizeListener = (listener) => {
  resizeListeners.push(listener);
  listener();
};

/**
 * window visibilitychange 이벤트 등록
 * @param {Function} visibleListener
 * @param {Function} hiddenListener
 */
export const addVisibilitychangeListener = (visibleListener, hiddenListener) => {
  visibleListeners.push(visibleListener);
  hiddenListeners.push(hiddenListener);
};

window.addEventListener('load', (e) => executeListeners(e, loadListeners));

window.addEventListener('beforeunload', (e) => executeListeners(e, beforeunloadListeners));

window.addEventListener('mouseout', (e) => {
  if (e.toElement === null) executeListeners(e, mouseoutToNullListeners);
  executeListeners(e, mouseoutListeners);
});

window.addEventListener('resize', (e) => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => executeListeners(e, resizeListeners), RESIZE_DELAY);
});

window.addEventListener('visibilitychange', (e) => {
  if (document.visibilityState === 'visible') {
    clearTimeout(visibleTimer);
    visibleTimer = setTimeout(() => executeListeners(e, visibleListeners), VISIBLE_DELAY);
  } else {
    executeListeners(e, hiddenListeners);
  }
});

function executeListeners(e, listeners) {
  if (listeners.length > 0) {
    console.debug(e.type, listeners);
    for (const listener of listeners) {
      listener(e);
    }
  }
}
