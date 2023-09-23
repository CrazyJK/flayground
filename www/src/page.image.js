import FlayImage from './elements/image/FlayImage';
import './page.image.scss';
import './util/theme.listener';

import SideNavBar from './elements/page/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

const main = document.querySelector('main');
const img = document.querySelector('img');
const imgIdx = document.querySelector('#imgIdx');
const imgPath = document.querySelector('#imgPath');
const imgName = document.querySelector('#imgName');
const imgSize = document.querySelector('#imgSize');

const flayImage = new FlayImage();
main.append(flayImage);

let imageSize = 0;
let imageIdx = 0;
let isRotated = false;
let playTimer = -1;

fetch('/image/size')
  .then((res) => res.text())
  .then((text) => {
    imageSize = Number(text);
    console.log('imageSize', imageSize);

    navigator('Space');
  });

window.addEventListener('resize', decideRotateView);
window.addEventListener('wheel', dispatchEventCode);
window.addEventListener('keyup', dispatchEventCode);
window.addEventListener('click', dispatchEventCode);

function dispatchEventCode(e) {
  console.debug('event', e);
  let code;
  if (e.type === 'wheel') {
    if (e.wheelDelta > 0) {
      code = 'WheelUp';
    } else {
      code = 'WheelDown';
    }
  } else if (e.type === 'keyup') {
    code = e.code;
  } else if (e.type === 'click') {
    code = e.ctrlKey || e.altKey ? 'Play' : 'Pause';
  }
  console.log('navigator', code);

  if (code === 'Play') {
    playTimer = setInterval(() => {
      navigator(e.ctrlKey ? 'WheelDown' : 'Space');
    }, 1000 * 10);
  } else if (code === 'Pause') {
    clearTimeout(playTimer);
  } else {
    navigator(code);
  }
}

function navigator(code) {
  switch (code) {
    case 'Space':
      imageIdx = Math.round(Math.random() * imageSize);
      break;
    case 'Home':
      imageIdx = 0;
      break;
    case 'End':
      imageIdx = imageSize - 1;
      break;
    case 'WheelUp':
    case 'ArrowUp':
    case 'ArrowLeft':
      --imageIdx;
      break;
    case 'WheelDown':
    case 'ArrowDown':
    case 'ArrowRight':
      ++imageIdx;
      break;
    case 'PageUp':
      imageIdx -= 10;
      break;
    case 'PageDown':
      imageIdx += 10;
      break;
    default:
      return;
  }
  if (imageIdx < 0) {
    imageIdx = imageSize - 1;
  } else if (imageIdx >= imageSize) {
    imageIdx = 0;
  }
  drawImage();
}

function drawImage() {
  flayImage.set(imageIdx).then((image) => {
    console.log(imageIdx, 'drawImage then', image.info, image.colors);
    decideRotateView();
    drawInfo();
  });
  progressBar();
}

function decideRotateView() {
  const isVerticalFrame = document.documentElement.clientWidth < document.documentElement.clientHeight;
  const isVerticalImage = flayImage.img.naturalWidth <= flayImage.img.naturalHeight;
  if (isVerticalFrame && isVerticalImage) {
    isRotated = false;
  } else if (isVerticalFrame && !isVerticalImage) {
    isRotated = document.documentElement.clientWidth < flayImage.img.naturalWidth;
  } else if (!isVerticalFrame && isVerticalImage) {
    isRotated = document.documentElement.clientHeight < flayImage.img.naturalHeight;
  } else {
    isRotated = false;
  }
  console.log(imageIdx, 'decideRotateView', isRotated);
  flayImage.classList.toggle('rotate', isRotated);
}

function drawInfo() {
  imgIdx.innerHTML = '#' + flayImage.info.idx;
  imgPath.innerHTML = flayImage.info.path;
  imgName.innerHTML = flayImage.info.name;
  imgSize.innerHTML = flayImage.img.naturalWidth + 'x' + flayImage.img.naturalHeight;
}

function progressBar() {
  document.querySelector('.progress-bar').style.width = (imageIdx / imageSize) * 100 + '%';
}
