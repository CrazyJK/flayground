const delay = 300;
let timer = null;

const callbacks = [];

export function addResizeLazyEventListener(callback) {
  callbacks.push(callback);
}

window.addEventListener('resize', () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.debug('window resize', callbacks);
    for (let callback of callbacks) {
      callback();
    }
  }, delay);
});
