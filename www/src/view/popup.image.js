import FlayImage from '@image/part/FlayImage';
import FlayFetch from '@lib/FlayFetch';
import { getRandomInt } from '@lib/randomNumber';
import './popup.image.scss';

const urlParams = new URL(location.href).searchParams;
const flayImage = document.body.appendChild(new FlayImage());

flayImage.addEventListener('loaded', (e) => {
  console.debug('Event: ', e.type, e);
  const { idx, name, width, height } = e.detail.info;
  document.title = `${idx} - ${name}`;
  window.resizeTo(width, height);
});

let clickCount = 0;
flayImage.addEventListener('click', (e) => {
  switch (++clickCount % 3) {
    case 0:
      // e.target.style.cssText = '';
      break;
    case 1:
      // e.target.style.cssText = 'height: 100%'; // 가로
      break;
    case 2:
      // e.target.style.cssText = 'width: 100%'; // 세로
      break;
  }
  console.debug('clickCount', clickCount);
});

(async () => {
  const setImage = (idx) => (flayImage.dataset.idx = idx);

  const Go = {
    prev: () => {
      if (--idx < 0) idx = max - 1;
      setImage(idx);
    },
    next: () => {
      if (++idx >= max) idx = 0;
      setImage(idx);
    },
    random: () => {
      idx = getRandomInt(0, max);
      setImage(idx);
    },
  };

  let max = Number(urlParams.get('max')) || (await FlayFetch.getImageSize());
  let idx = Number(urlParams.get('idx')) || getRandomInt(0, max);
  console.debug('params: idx', idx, 'max', max);

  setImage(idx);

  window.addEventListener('wheel', (e) => {
    console.debug('Event: ', e.type, e);
    if (e.wheelDelta > 0) {
      Go.prev();
    } else {
      Go.next();
    }
  });

  window.addEventListener('keyup', (e) => {
    console.debug('Event: ', e.type, e.code);
    switch (e.code) {
      case 'Space':
        Go.random();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        Go.prev();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        Go.next();
        break;
    }
  });
})();
