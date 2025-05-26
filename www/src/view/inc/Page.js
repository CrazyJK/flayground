import FlayFetch from '@/lib/FlayFetch';
import '@lib/SseConnector';
import '@lib/UpdateMyPosition';
import './Page.scss';

import(/* webpackChunkName: "SideNavBar" */ '@nav/SideNavBar').then(({ SideNavBar }) => {
  document.body.prepend(new SideNavBar());
});

document.body.style.backgroundImage = 'url(./svg/flayground-circle.svg)';

FlayFetch.getImageSize().then((imageLength) => {
  // imageLength 만큼 배열 생성
  const imageIndices = Array.from({ length: imageLength }, (_, i) => i);

  const imagePanel = document.body.appendChild(document.createElement('div'));
  imagePanel.className = 'image-panel';

  const showImage = () => {
    URL.revokeObjectURL(imageURL);

    // imageIndices에서 랜덤하게 하나 제거
    if (imageIndices.length === 0) {
      imageIndices.push(...Array.from({ length: imageLength }, (_, i) => i)); // 모든 이미지가 표시되었으면 초기화
    }
    const randomIndex = Math.floor(Math.random() * imageIndices.length);
    const idx = imageIndices.splice(randomIndex, 1)[0];

    FlayFetch.getStaticImage(idx).then(({ name, path, modified, imageBlob }) => {
      imageURL = URL.createObjectURL(imageBlob);
      imagePanel.title = name;
      imagePanel.style.backgroundImage = `url(${imageURL})`;
      imagePanel.animate([{ transform: 'scale(0.1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 2000, easing: 'ease-in-out' });
    });
  };

  let imageURL;
  setInterval(() => showImage(), 10000);
});
