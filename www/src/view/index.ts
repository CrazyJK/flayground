import './inc/Page';
import './index.scss';

import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
  .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
  .then((imageCircle) => {
    imageCircle.style.position = 'fixed';
    imageCircle.style.right = '0';
    imageCircle.style.bottom = '0';

    document.head.appendChild(document.createElement('style')).textContent = `
      .image-circle {
        opacity: 0.5;
        transition: opacity 0.3s ease-in-out;
      }
      .image-circle:hover {
        opacity: 1;
      }`;
    document.body.appendChild(imageCircle);
  });

class FacadeWebMovie extends HTMLVideoElement {
  constructor() {
    super();
    this.style.width = '30rem';
    this.style.maxWidth = '50%';
    this.style.clipPath = 'circle(50% at 50% 50%)';
    this.autoplay = true;
    this.loop = false;
    this.volume = 0.5;
    this.addEventListener('ended', () => this.remove());
  }
  connectedCallback() {
    this.src = '/res/Cocks_not_standing.webm';
  }
}
customElements.define('facade-web-movie', FacadeWebMovie, { extends: 'video' });

document.querySelector('body > main').appendChild(new FacadeWebMovie());
