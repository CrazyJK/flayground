var delay = 300;
var timer = null;

export function addResizeLazyEventListener(callback) {
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log('window resize', callback);
      if (callback) {
        callback();
      }
    }, delay);
  });
}
