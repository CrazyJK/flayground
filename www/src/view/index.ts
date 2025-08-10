import './inc/Page';
import './index.scss';

import(/* webpackChunkName: "FacadeWebMovie" */ '@movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie())
  .then(async (facadeWebMovie) => {
    const mainElement = document.querySelector('body > main');
    if (mainElement) {
      mainElement.appendChild(facadeWebMovie);
      await facadeWebMovie.isEnded();
    } else {
      console.warn('Main element not found');
    }
  })
  .then(() => {
    import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
      .then((imageCircle) => {
        document.head.appendChild(document.createElement('style')).textContent = `
        .image-circle { opacity: 0.5; transition: opacity 0.3s ease-in-out; }
        .image-circle:hover { opacity: 1; }`;
        imageCircle.classList.add('right-bottom');
        document.body.appendChild(imageCircle);
      })
      .catch((error: unknown) => {
        console.error('ImageCircle 로딩 실패:', error);
      });

    import(/* webpackChunkName: "FlayMarkerFloat" */ '@flay/panel/FlayMarkerFloat')
      .then(({ FlayMarkerFloat }) => new FlayMarkerFloat())
      .then((flayMarkerFloat) => {
        document.body.appendChild(flayMarkerFloat);
      })
      .catch((error: unknown) => {
        console.error('FlayMarkerFloat 로딩 실패:', error);
      });
  })
  .catch((error: unknown) => {
    console.error('초기화 중 오류 발생:', error);
  });
