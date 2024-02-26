const DELAY = 300;
const listeners = [];

let timer = null;

/**
 * window resize 이벤트 핸들러를 등록한다
 * @param {Function} listener
 */
export function addResizeLazyEventListener(listener) {
  listeners.push(listener);
  window.dispatchEvent(new Event('resize'));
}

window.addEventListener('resize', () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.debug('window resize', listeners);
    for (const callback of listeners) {
      callback();
    }
  }, DELAY);
});
