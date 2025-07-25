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
      const imageAnimate = (image: HTMLImageElement, duration: number): void => {
        image.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration, easing: 'ease-in-out' });
      };

      const startIndex = Math.floor(Math.random() * imageLength);

      let i = 0;
      let showCondition = true;
      do {
        const headerIndex = startIndex - i >= 0 ? startIndex - i : startIndex + i;
        const footerIndex = startIndex + i < imageLength ? startIndex + i : startIndex - i;

        const headerImage = getImage(headerIndex);
        const footerImage = getImage(footerIndex);
        document.querySelector('body > header').prepend(headerImage);
        document.querySelector('body > footer').append(footerImage);

        imageAnimate(headerImage, 500);
        imageAnimate(footerImage, 500);

        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms 대기
        i++;

        const rect = footerImage.getBoundingClientRect();
        if (window.innerWidth <= rect.right) {
          showCondition = false;
        }
      } while (showCondition);

      const headerImages = Array.from(document.querySelectorAll('body > header > img'));
      const footerImages = Array.from(document.querySelectorAll('body > footer > img'));
      const columnCount = headerImages.length;

      let columnIndex = 0;
      let loopCondition = columnCount > 0;
      do {
        const index = columnIndex++ % columnCount;
        const backIndex = columnCount - index - 1;

        const headerImage = headerImages[backIndex] as HTMLImageElement;
        const footerImage = footerImages[index] as HTMLImageElement;

        imageAnimate(headerImage, 500);
        imageAnimate(footerImage, 500);

        headerImage.src = `/api/v1/static/image/${startIndex - i}`;
        footerImage.src = `/api/v1/static/image/${startIndex + i}`;

        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms 대기
        i++;
      } while (loopCondition);
    });
  });
