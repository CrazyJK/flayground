const resizeListeners = [];
const beforeunloadListeners = [];
const loadListeners = [];
const mouseoutListeners = [];
const visibleListeners = [];
const hiddenListeners = [];

const RESIZE_DELAY = 300;
const VISIBLE_DELAY = 300;

let resizeTimer = null;
let visibleTimer = null;

/**
 * window resize 이벤트 핸들러를 등록한다
 * @param {Function} listener
 */
export function addResizeListener(listener) {
  resizeListeners.push(listener);
  window.dispatchEvent(new Event('resize'));
}

/**
 * window load 이벤트 등록
 * @param {Function} listener
 */
export function addLoadListener(listener) {
  loadListeners.push(listener);
}

/**
 * window beforeunload 이벤트 등록
 * @param {Function} listener
 */
export function addBeforeunloadListener(listener) {
  beforeunloadListeners.push(listener);
}

/**
 * window mouseout 이벤트 등록
 * @param {Function} listener
 */
export function addMouseoutListener(listener) {
  mouseoutListeners.push(listener);
}

/**
 * window visibilitychange 이벤트 등록
 * @param {Function} visibleListener
 * @param {Function} hiddenListener
 */
export function addVisibilitychangeListener(visibleListener, hiddenListener) {
  visibleListeners.push(visibleListener);
  hiddenListeners.push(hiddenListener);
}

window.addEventListener('resize', (e) => {
  console.debug(e.type, resizeListeners);
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    console.debug('window resize', resizeListeners);
    for (const listener of resizeListeners) {
      listener(e);
    }
  }, RESIZE_DELAY);
});

window.addEventListener('beforeunload', (e) => {
  console.debug(e.type, beforeunloadListeners);
  for (const listener of beforeunloadListeners) {
    listener(e);
  }
});

window.addEventListener('load', (e) => {
  console.debug(e.type, loadListeners);
  for (const listener of loadListeners) {
    listener(e);
  }
});

window.addEventListener('mouseout', (e) => {
  console.debug(e.type, mouseoutListeners);
  for (const listener of mouseoutListeners) {
    listener(e);
  }
});

window.addEventListener('visibilitychange', (e) => {
  console.debug(e.type, visibleListeners, hiddenListeners);
  if (document.visibilityState === 'visible') {
    clearTimeout(visibleTimer);
    visibleTimer = setTimeout(() => {
      for (const listener of visibleListeners) {
        listener(e);
      }
    }, VISIBLE_DELAY);
  } else {
    for (const listener of hiddenListeners) {
      listener(e);
    }
  }
});
