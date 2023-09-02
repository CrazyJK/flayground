import './page.image.scss';
import { getDominatedColors } from './util/dominatedColor';
import './util/theme.listener';

const main = document.querySelector('main');
const imgIdx = document.querySelector('#imgIdx');
const imgPath = document.querySelector('#imgPath');
const imgName = document.querySelector('#imgName');
const imgSize = document.querySelector('#imgSize');

let isMainVertical = true;
let imageSize = 0;
let imageIdx = 0;

fetch('/image/size')
  .then((res) => res.text())
  .then((text) => {
    imageSize = Number(text);
    console.log('imageSize', imageSize);

    random();
  });

window.addEventListener('resize', () => {
  isMainVertical = document.documentElement.clientWidth < document.documentElement.clientHeight;
  main.classList.toggle('vertical', isMainVertical);
  console.log('isMainVertical', document.documentElement.clientWidth, document.documentElement.clientHeight, isMainVertical);
});
window.dispatchEvent(new Event('resize'));

window.addEventListener('wheel', (e) => {
  console.debug('wheel', e);
  if (e.wheelDelta > 0) {
    prev();
  } else {
    next();
  }
});

window.addEventListener('keyup', (e) => {
  console.debug('keyup', e.code);
  switch (e.code) {
    case 'Space':
      random();
      break;
    case 'Home':
      first();
      break;
    case 'End':
      end();
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      prev();
      break;
    case 'ArrowDown':
    case 'ArrowRight':
      next();
      break;
    case 'PageUp':
      prev(10);
      break;
    case 'PageDown':
      next(10);
      break;
  }
});

function random() {
  imageIdx = Math.round(Math.random() * imageSize);
  drawImage();
}

function first() {
  imageIdx = 0;
  drawImage();
}

function end() {
  imageIdx = imageSize - 1;
  drawImage();
}

function prev(n) {
  if (n) {
    imageIdx -= n;
  } else {
    --imageIdx;
  }

  if (imageIdx < 0) {
    imageIdx = 0;
    return;
  }
  drawImage();
}

function next(n) {
  if (n) {
    imageIdx += n;
  } else {
    ++imageIdx;
  }

  if (imageIdx >= imageSize) {
    imageIdx = imageSize - 1;
    return;
  }
  drawImage();
}

function drawImage() {
  let image = new Image();
  image.onload = () => {
    console.log('img loaded', image.naturalWidth, image.naturalHeight);
    let isIamgeVertical = image.naturalWidth <= image.naturalHeight;
    let vertical = true;
    if (isMainVertical && isIamgeVertical) {
      vertical = true;
    } else if (isMainVertical && !isIamgeVertical) {
      vertical = document.documentElement.clientWidth > image.naturalWidth;
    } else if (!isMainVertical && isIamgeVertical) {
      vertical = document.documentElement.clientHeight < image.naturalHeight;
    } else {
      vertical = false;
    }
    image.classList.toggle('vertical', vertical);

    fetch('/image/' + imageIdx)
      .then((res) => res.json())
      .then((imageInfo) => {
        console.log('imageInfo', imageInfo);
        imgIdx.innerHTML = '#' + imageInfo.idx;
        imgPath.innerHTML = imageInfo.path;
        imgName.innerHTML = imageInfo.name;
        imgSize.innerHTML = image.naturalWidth + 'x' + image.naturalHeight;
      });

    getDominatedColors(image, { scale: 0.2, offset: 16, limit: 5 }).then((dominatedColors) => {
      console.log('dominatedColors', dominatedColors);
      image.style.boxShadow = `0.25rem 0.5rem 2rem 0 rgba(${dominatedColors[1].rgba.join(',')})`;
      main.style.background = `radial-gradient(rgba(${dominatedColors[0].rgba.join(',')}), rgba(${dominatedColors[4].rgba.join(',')}))`;
    });

    document.querySelector('.progress-bar').style.width = (imageIdx / imageSize) * 100 + '%';

    main.textContent = null;
    main.appendChild(image);
  };
  image.src = '/static/image/' + imageIdx;
}
