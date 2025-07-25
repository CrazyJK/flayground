import FlayFetch from '../lib/FlayFetch';
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

import(/* webpackChunkName: "FacadeWebMovie" */ '@/movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie())
  .then(async (facadeWebMovie) => {
    document.querySelector('body > main').appendChild(facadeWebMovie);
    await facadeWebMovie.isEnded();

    FlayFetch.getImageSize().then(async (imageLength) => {
      const getImage = (index: number): HTMLImageElement => {
        const img = document.createElement('img');
        img.src = `/api/v1/static/image/${index}`;
        return img;
      };
      const startIndex = Math.floor(Math.random() * imageLength);

      for (let i = 0; i < 10; i++) {
        document.querySelector('body > header').prepend(getImage(startIndex - i));
        document.querySelector('body > footer').append(getImage(startIndex + i));

        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms 대기
      }
    });
  });
