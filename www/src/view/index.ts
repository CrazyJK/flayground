import FlayImage from '../image/part/FlayImage';
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
      const getImage = (index: number): FlayImage => {
        const img = new FlayImage({ magnifier: false });
        img.dataset.idx = index.toString();
        return img;
      };
      const hideOpacity = 0.25;
      const imageShowAnimate = (image: HTMLImageElement, duration: number = 1000): Promise<void> => {
        return new Promise((resolve) => {
          image.animate([{ opacity: hideOpacity }, { opacity: 1 }], { duration, easing: 'ease-in-out' }).onfinish = () => {
            resolve();
          };
        });
      };
      const imageHideAnimate = (image: HTMLImageElement, duration: number = 1000): Promise<void> => {
        return new Promise((resolve) => {
          image.animate([{ opacity: 1 }, { opacity: hideOpacity }], { duration, easing: 'ease-in-out' }).onfinish = () => {
            resolve();
          };
        });
      };

      const startIndex = Math.floor(Math.random() * imageLength);
      let offset = 0;

      let showCondition = true;
      do {
        const headerIndex = startIndex - offset >= 0 ? startIndex - offset : startIndex + offset;
        const footerIndex = startIndex + offset < imageLength ? startIndex + offset : startIndex - offset;

        const headerImage = getImage(headerIndex);
        const footerImage = getImage(footerIndex);
        document.querySelector('body > header').prepend(headerImage);
        document.querySelector('body > footer').append(footerImage);

        await Promise.all([imageShowAnimate(headerImage), imageShowAnimate(footerImage)]);

        const { right } = footerImage.getBoundingClientRect();
        showCondition = window.innerWidth > right;

        offset++;
      } while (showCondition);

      const headerImages = Array.from(document.querySelectorAll('body > header > img')) as HTMLImageElement[];
      const footerImages = Array.from(document.querySelectorAll('body > footer > img')) as HTMLImageElement[];
      const columnCount = footerImages.length;

      let columnIndex = 0;
      let loopCondition = columnCount > 0;
      do {
        const index = columnIndex++ % columnCount;
        const backIndex = columnCount - index - 1;

        const headerImage = headerImages[backIndex];
        const footerImage = footerImages[index];

        await Promise.all([imageHideAnimate(headerImage, 300), imageHideAnimate(footerImage, 300)]);
        headerImage.dataset.idx = (startIndex - offset).toString();
        footerImage.dataset.idx = (startIndex + offset).toString();
        await Promise.all([imageShowAnimate(headerImage, 700), imageShowAnimate(footerImage, 700)]);

        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms 대기
        offset++;
      } while (loopCondition);
    });
  });
