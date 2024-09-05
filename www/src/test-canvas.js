import './test-canvas.scss';

const canvas1 = document.querySelector('#canvas1');
const ctx1 = canvas1.getContext('2d');

ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
// 컨텍스트 리셋
ctx1.beginPath();

ctx1.font = '30px Comic Sans MS';
ctx1.fillStyle = 'red';
ctx1.textAlign = 'center';
ctx1.fillText('Hello World', canvas1.width / 2, canvas1.height / 2);

canvas1.toBlob((blob) => {
  const newImg = document.createElement('img');
  const url = URL.createObjectURL(blob);

  newImg.onload = () => {
    // no longer need to read the blob so it's revoked
    URL.revokeObjectURL(url);
  };

  newImg.src = url;
  document.querySelector('article').appendChild(newImg);
});

const canvas2 = document.querySelector('#canvas2');
const ctx2 = canvas2.getContext('2d');

const img = document.querySelector('#favicon');
img.onload = () => {
  const wrh = img.width / img.height;
  let newWidth = canvas2.width;
  let newHeight = newWidth / wrh;
  if (newHeight > canvas2.height) {
    newHeight = canvas2.height;
    newWidth = newHeight * wrh;
  }
  const xOffset = newWidth < canvas2.width ? (canvas2.width - newWidth) / 2 : 0;
  const yOffset = newHeight < canvas2.height ? (canvas2.height - newHeight) / 2 : 0;

  ctx2.drawImage(img, xOffset, yOffset, newWidth, newHeight);
};

const canvas3 = document.querySelector('#canvas3');
const ctx3 = canvas3.getContext('2d');
ctx3.lineWidth = 6;
ctx3.lineCap = 'round';
ctx3.lineJoin = 'round';

let shouldDraw = false;

const MAIN_MOUSE_BUTTON = 0;

document.querySelector('#canvas3Switch').addEventListener('change', (e) => {
  let checked = e.target.checked;
  if (checked) {
    canvas3.addEventListener('mousedown', drawStart);
    canvas3.addEventListener('mouseup', drawEnd);
    canvas3.addEventListener('mousemove', drawing);
    canvas3.addEventListener('mouseleave', drawEnd);
  } else {
    canvas3.removeEventListener('mousedown', drawStart);
    canvas3.removeEventListener('mouseup', drawEnd);
    canvas3.removeEventListener('mousemove', drawing);
    canvas3.removeEventListener('mouseleave', drawEnd);
  }
});

document.querySelector('#canvas3Clear').addEventListener('click', () => {
  ctx3.clearRect(0, 0, canvas1.width, canvas1.height);
  ctx3.beginPath();
});

document.querySelector('#canvas3GetImage').addEventListener('click', () => {
  canvas3.toBlob((blob) => {
    const newImg = document.createElement('img');
    const url = URL.createObjectURL(blob);

    newImg.onload = () => {
      // no longer need to read the blob so it's revoked
      URL.revokeObjectURL(url);
    };

    newImg.src = url;
    document.querySelector('article:nth-child(3)').appendChild(newImg);
  });
});

function drawStart(event) {
  if (event.button === MAIN_MOUSE_BUTTON) {
    shouldDraw = true;
    ctx3.beginPath();
    let elementRect = event.target.getBoundingClientRect();
    ctx3.moveTo(event.clientX - elementRect.left, event.clientY - elementRect.top);
  }
}
function drawEnd(event) {
  if (event.button === MAIN_MOUSE_BUTTON) {
    shouldDraw = false;
  }
}
function drawing(event) {
  if (shouldDraw) {
    let elementRect = event.target.getBoundingClientRect();
    ctx3.lineTo(event.clientX - elementRect.left, event.clientY - elementRect.top);
    ctx3.stroke();
  }
}
