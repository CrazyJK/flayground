import './test-canvas.scss';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

ctx.font = '30px Comic Sans MS';
ctx.fillStyle = 'red';
ctx.textAlign = 'center';
ctx.fillText('Hello World', canvas.width / 2, canvas.height / 2);

canvas.toBlob((blob) => {
  const newImg = document.createElement('img');
  const url = URL.createObjectURL(blob);

  newImg.onload = () => {
    // no longer need to read the blob so it's revoked
    URL.revokeObjectURL(url);
  };

  newImg.src = url;
  document.body.appendChild(newImg);
});

ctx.clearRect(0, 0, canvas.width, canvas.height);
// 컨텍스트 리셋
ctx.beginPath();

const img = document.querySelector('#favicon');
img.onload = () => {
  const wrh = img.width / img.height;
  let newWidth = canvas.width;
  let newHeight = newWidth / wrh;
  if (newHeight > canvas.height) {
    newHeight = canvas.height;
    newWidth = newHeight * wrh;
  }
  const xOffset = newWidth < canvas.width ? (canvas.width - newWidth) / 2 : 0;
  const yOffset = newHeight < canvas.height ? (canvas.height - newHeight) / 2 : 0;

  ctx.drawImage(img, xOffset, yOffset, newWidth, newHeight);
};
