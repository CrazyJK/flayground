import FlayImage from '@image/part/FlayImage';
import FlayAction from '@lib/FlayAction';
import FlayFetch from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';
import folderSVG from '@svg/folder';
import trashBin from '@svg/trashBin';
import './popup.image.scss';

const flayImage = document.body.appendChild(new FlayImage());
const trashBtn = document.body.appendChild(document.createElement('button'));
trashBtn.classList.add('trash-button');
trashBtn.innerHTML = trashBin;

const openBtn = document.body.appendChild(document.createElement('button'));
openBtn.classList.add('open-button');
openBtn.innerHTML = folderSVG;

let [idx, max] = [0, 0];

const setImageIdx = (idx: number) => {
  flayImage.dataset.idx = idx.toString();
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
    idx = RandomUtils.getRandomInt(0, max);
    setImageIdx(idx);
  },
};

// Animate window resize
const animateResize = (targetWidth: number, targetHeight: number, duration = 100) => {
  const startWidth = window.outerWidth;
  const startHeight = window.outerHeight;
  const widthDiff = targetWidth - startWidth;
  const heightDiff = targetHeight - startHeight;
  const startLeft = window.screenX;
  const startTop = window.screenY;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
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

const imageLoadHandler = (e: Event) => {
  const { idx, name, width, height } = (e as CustomEvent).detail.info;
  document.title = `${idx} - ${name}`;
  animateResize(width, height);
};

const wheelNavigationHandler = (e: WheelEvent) => {
  e.preventDefault();
  if (e.deltaY > 0) {
    Go.next();
  } else {
    Go.prev();
  }
};

const keyNavigationHandler = (e: KeyboardEvent) => {
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

const folderOpener = () => {
  void FlayAction.explore(flayImage.dataset.path!);
};

void (async () => {
  const hashIdx = new URL(location.href).hash.substring(1);

  max = await FlayFetch.getImageSize();
  idx = parseInt(hashIdx) || RandomUtils.getRandomInt(0, max);

  window.addEventListener('wheel', wheelNavigationHandler, { passive: false });
  window.addEventListener('keyup', keyNavigationHandler, { passive: true });
  flayImage.addEventListener('loaded', imageLoadHandler);
  trashBtn.addEventListener('click', imageRemover);
  openBtn.addEventListener('click', folderOpener);

  setImageIdx(idx);
})();
