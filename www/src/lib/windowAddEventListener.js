const eventListeners = {
  resize: [],
  beforeunload: [],
  load: [],
  mouseout: [],
  mouseoutToNull: [],
  visible: [],
  hidden: [],
};

const RESIZE_DELAY = 300;
const VISIBLE_DELAY = 300;

let resizeTimer;
let visibleTimer;

/**
 * window load 이벤트 등록
 * @param {Function} listener
 * @returns {Function} 리스너 제거 함수
 */
export const addLoadListener = (listener) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.load.push(listener);
  return () => removeListener('load', listener);
};

/**
 * window beforeunload 이벤트 등록
 * @param {Function} listener
 * @returns {Function} 리스너 제거 함수
 */
export const addBeforeunloadListener = (listener) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.beforeunload.push(listener);
  return () => removeListener('beforeunload', listener);
};

/**
 * window mouseout 이벤트 등록
 * @param {Function} listener
 * @returns {Function} 리스너 제거 함수
 */
export const addMouseoutListener = (listener) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.mouseout.push(listener);
  return () => removeListener('mouseout', listener);
};

/**
 * 마우스가 화면 밖으로 나간 이벤트 등록
 * @param {Function} listener
 * @returns {Function} 리스너 제거 함수
 */
export const addMouseoutToNullListener = (listener) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.mouseoutToNull.push(listener);
  return () => removeListener('mouseoutToNull', listener);
};

/**
 * window resize 이벤트 핸들러를 등록한다.
 * - 등록 즉시 1회 수행한다
 * @param {Function} listener
 * @returns {Function} 리스너 제거 함수
 */
export const addResizeListener = (listener) => {
  if (typeof listener !== 'function') {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }
  eventListeners.resize.push(listener);
  listener();
  return () => removeListener('resize', listener);
};

/**
 * window visibilitychange 이벤트 등록
 * @param {Function} visibleListener
 * @param {Function} hiddenListener
 * @returns {Function} 리스너 제거 함수
 */
export const addVisibilitychangeListener = (visibleListener, hiddenListener) => {
  if (typeof visibleListener !== 'function' || (hiddenListener && typeof hiddenListener !== 'function')) {
    console.error('리스너는 함수여야 합니다');
    return () => {};
  }

  eventListeners.visible.push(visibleListener);
  if (hiddenListener) {
    eventListeners.hidden.push(hiddenListener);
  }

  return () => {
    removeListener('visible', visibleListener);
    if (hiddenListener) {
      removeListener('hidden', hiddenListener);
    }
  };
};

/**
 * 등록된 리스너 제거
 * @param {string} eventType 이벤트 타입
 * @param {Function} listener 제거할 리스너 함수
 * @returns {boolean} 제거 성공 여부
 */
export const removeListener = (eventType, listener) => {
  if (!eventListeners[eventType]) {
    console.warn(`알 수 없는 이벤트 타입: ${eventType}`);
    return false;
  }

  const index = eventListeners[eventType].indexOf(listener);
  if (index !== -1) {
    eventListeners[eventType].splice(index, 1);
    return true;
  }
  return false;
};

/**
 * 모든 이벤트 리스너 초기화
 * @param {string} [eventType] 특정 이벤트 타입만 초기화 (생략 시 모든 이벤트)
 */
export const clearListeners = (eventType) => {
  if (eventType) {
    if (eventListeners[eventType]) {
      eventListeners[eventType] = [];
    } else {
      console.warn(`알 수 없는 이벤트 타입: ${eventType}`);
    }
  } else {
    Object.keys(eventListeners).forEach((type) => {
      eventListeners[type] = [];
    });
  }
};

// 이벤트 리스너 실행 함수
function executeListeners(e, listeners) {
  if (listeners.length > 0) {
    console.debug(e.type, listeners);
    for (const listener of listeners) {
      try {
        listener(e);
      } catch (error) {
        console.error(`이벤트 리스너 실행 중 오류 발생: ${error.message}`, error);
      }
    }
  }
}

// 이벤트 등록
window.addEventListener('load', (e) => executeListeners(e, eventListeners.load));

window.addEventListener('beforeunload', (e) => executeListeners(e, eventListeners.beforeunload));

window.addEventListener('mouseout', (e) => {
  if (e.toElement === null) {
    executeListeners(e, eventListeners.mouseoutToNull);
  }
  executeListeners(e, eventListeners.mouseout);
});

window.addEventListener('resize', (e) => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => executeListeners(e, eventListeners.resize), RESIZE_DELAY);
});

window.addEventListener('visibilitychange', (e) => {
  if (document.visibilityState === 'visible') {
    clearTimeout(visibleTimer);
    visibleTimer = setTimeout(() => executeListeners(e, eventListeners.visible), VISIBLE_DELAY);
  } else {
    executeListeners(e, eventListeners.hidden);
  }
});
