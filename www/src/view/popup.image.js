import FlayImage from '@image/part/FlayImage';
import FlayFetch from '@lib/FlayFetch';
import { getRandomInt } from '@lib/randomNumber';
import trashBin from '@svg/trashBin';
import './popup.image.scss';

const flayImage = document.body.appendChild(new FlayImage());
const trashBtn = document.body.appendChild(document.createElement('button'));
trashBtn.classList.add('trash-button');
trashBtn.innerHTML = trashBin;

let [idx, max] = [0, 0];

const setImageIdx = (idx) => {
  flayImage.dataset.idx = idx;
  window.location.hash = `#${idx}`;
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

const imageLoadHandler = (e) => {
  const { idx, name, width, height } = e.detail.info;
  document.title = `${idx} - ${name}`;
  animateResize(width, height);
};

const wheelNavigationHandler = (e) => {
  e.preventDefault();
  if (e.deltaY > 0) {
    Go.next();
  } else {
    Go.prev();
  }
};

const keyNavigationHandler = (e) => {
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

const imageRemover = async () => {
  const confirmed = confirm('Are you sure you want to delete this image?');
  if (!confirmed) return;

  try {
    await FlayFetch.removeImage(idx);
    Go.next();
  } catch (error) {
    console.error('Error removing image:', error);
    alert('Failed to remove the image. Please try again later.');
  }
};

(async () => {
  const hashIdx = new URL(location.href).hash.substring(1);

  max = await FlayFetch.getImageSize();
  idx = parseInt(hashIdx) || getRandomInt(0, max);

  window.addEventListener('wheel', wheelNavigationHandler, { passive: false });
  window.addEventListener('keyup', keyNavigationHandler, { passive: true });
  flayImage.addEventListener('loaded', imageLoadHandler);
  trashBtn.addEventListener('click', imageRemover);

  setImageIdx(idx);
})();
