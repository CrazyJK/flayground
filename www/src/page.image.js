import './page.image.scss';
import { getDominatedColors } from './util/dominatedColor';
import './util/theme.listener';

import SideNavBar from './elements/page/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

const main = document.querySelector('main');
const img = document.querySelector('img');
const imgIdx = document.querySelector('#imgIdx');
const imgPath = document.querySelector('#imgPath');
const imgName = document.querySelector('#imgName');
const imgSize = document.querySelector('#imgSize');

let imageSize = 0;
let imageIdx = 0;
let isRotated = false;
let fetchTimer = -1;
let colorTimer = -1;
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
  img.src = '/static/image/' + imageIdx;
  img.onload = () => {
    console.log(imageIdx, 'img onload', img.naturalWidth, img.naturalHeight);
    decideRotateView();
    progressBar();
    fetchImageInfo();
    postProcess();
  };
}

function decideRotateView() {
  const isVerticalFrame = document.documentElement.clientWidth < document.documentElement.clientHeight;
  const isVerticalImage = img.naturalWidth <= img.naturalHeight;
  if (isVerticalFrame && isVerticalImage) {
    isRotated = false;
  } else if (isVerticalFrame && !isVerticalImage) {
    isRotated = document.documentElement.clientWidth < img.naturalWidth;
  } else if (!isVerticalFrame && isVerticalImage) {
    isRotated = document.documentElement.clientHeight < img.naturalHeight;
  } else {
    isRotated = false;
  }
  console.log(imageIdx, 'decideRotateView', isRotated);
  img.classList.toggle('rotate', isRotated);
}

function progressBar() {
  document.querySelector('.progress-bar').style.width = (imageIdx / imageSize) * 100 + '%';
}

function fetchImageInfo() {
  clearTimeout(fetchTimer);
  fetchTimer = setTimeout(() => {
    fetch('/image/' + imageIdx)
      .then((res) => res.json())
      .then((imageInfo) => {
        console.log(imageIdx, 'imageInfo', imageInfo);
        imgIdx.innerHTML = '#' + imageInfo.idx;
        imgPath.innerHTML = imageInfo.path;
        imgName.innerHTML = imageInfo.name;
        imgSize.innerHTML = img.naturalWidth + 'x' + img.naturalHeight;
      });
  }, 1000 * 1);
}

function postProcess() {
  clearTimeout(colorTimer);
  colorTimer = setTimeout(() => {
    getDominatedColors(img, { scale: 0.2, offset: 16, limit: 5 }).then((dominatedColors) => {
      console.log(imageIdx, 'dominatedColors', dominatedColors);
      img.style.boxShadow = `0.25rem 0.5rem 2rem 0 rgba(${dominatedColors[0].rgba.join(',')})`;
      // main.style.backgroundImage = `radial-gradient(rgba(${dominatedColors[0].rgba.join(',')}), rgba(${dominatedColors[4].rgba.join(',')}))`;
      // main.style.backgroundImage = `url(/static/image/${imageIdx})`;
      // main.style.backgroundColor = `rgba(${dominatedColors[0].rgba.join(',')}`;
      if (isRotated) {
        // main.style.transform = 'rotate(90deg)';
        // main.style.left = '-' + Math.abs(document.documentElement.clientWidth - document.documentElement.clientHeight) / 2 + 'px';
        // main.style.right = '-' + Math.abs(document.documentElement.clientWidth - document.documentElement.clientHeight) / 2 + 'px';
      } else {
        // main.style.transform = 'rotate(0deg)';
        // main.style.left = 0;
        // main.style.right = 0;
      }
    });
  }, 100);
}
