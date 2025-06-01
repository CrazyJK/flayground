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
  // Animate window resize
  const animateResize = (targetWidth, targetHeight, duration = 300) => {
    const startWidth = window.outerWidth;
    const startHeight = window.outerHeight;
    const widthDiff = targetWidth - startWidth;
    const heightDiff = targetHeight - startHeight;
    const startLeft = window.screenX;
    const startTop = window.screenY;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2; // Smooth easing

      const currentWidth = Math.round(startWidth + widthDiff * easeProgress);
      const currentHeight = Math.round(startHeight + heightDiff * easeProgress);

      // Calculate new position to keep window centered
      const newLeft = startLeft - (widthDiff * easeProgress) / 2;
      const newTop = startTop - (heightDiff * easeProgress) / 2;

      window.resizeTo(currentWidth, currentHeight);
      window.moveTo(newLeft, newTop);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  animateResize(width, height);
  // window.resizeTo(width, height);
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
