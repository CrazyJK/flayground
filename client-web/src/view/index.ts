import './inc/Page';
import './index.scss';

import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
  .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
  .then((imageCircle) =>
    imageCircle.addExtraStyle(`
      image-circle {
        position: fixed;
        right: 0;
        bottom: 0;
        opacity: 0.5;
        transition: opacity 0.3s ease-in-out;
      }
      image-circle:hover {
        opacity: 1;
      }`)
  )
  .then((imageCircle) => document.body.appendChild(imageCircle))
  .catch(console.error);
