import FlayImage from '@image/part/FlayImage';
import FlayFetch from '@lib/FlayFetch';
import { getRandomInt } from '@lib/randomNumber';
import './popup.image.scss';

const urlParams = new URL(location.href).searchParams;
const flayImage = document.body.appendChild(new FlayImage());

let [idx, max] = [0, 0];

const setImageIdx = (idx) => (flayImage.dataset.idx = idx);

const handleLoad = (e) => {
  const { idx, name, width, height } = e.detail.info;
  document.title = `${idx} - ${name}`;
  animateResize(width, height);
};

const Go = {
  prev: () => {
    if (--idx < 0) idx = max - 1;
    setImageIdx(idx);
  },
  next: () => {
    if (++idx >= max) idx = 0;
    setImageIdx(idx);
  },
  random: () => {
    idx = getRandomInt(0, max);
    setImageIdx(idx);
  },
};

// Animate window resize
const animateResize = (targetWidth, targetHeight, duration = 100) => {
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

const handleWheel = (e) => {
  e.preventDefault();
  if (e.deltaY > 0) {
    Go.prev();
  } else {
    Go.next();
  }
};

const handleKeyup = (e) => {
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
    case 'Escape':
      window.close();
      break;
  }
};

(async () => {
  const imageSize = await FlayFetch.getImageSize();
  if (!imageSize) {
    console.error('Failed to fetch image size.');
    return;
  }

  max = Number(urlParams.get('max') ?? imageSize);
  idx = Number(urlParams.get('idx') ?? getRandomInt(0, max));

  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('keyup', handleKeyup, { passive: true });
  flayImage.addEventListener('loaded', handleLoad);

  setImageIdx(idx);
})();
