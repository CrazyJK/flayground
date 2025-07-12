import './inc/Page';
import './index.scss';

import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
  .then(({ ImageCircle }) => new ImageCircle(ImageCircle.DEFAULT_OPTIONS))
  .then((imageCircle) => {
    imageCircle.style.position = 'fixed';
    imageCircle.style.right = '0';
    imageCircle.style.bottom = '0';
    document.querySelector('body > main').appendChild(imageCircle);
  });
