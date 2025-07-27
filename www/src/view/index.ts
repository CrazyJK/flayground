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
  });

FlayFetch.getImageSize().then(async (imageLength) => {
  const style = document.createElement('style');
  style.textContent = `
    body > header, 
    body > footer {
      display: flex;
      justify-content: flex-end;
      contain: layout style;
    }
    body > footer {
      justify-content: flex-start;
    }
    body > header > img,
    body > footer > img {
      display: inline-block;
      aspect-ratio: 9 / 16;
      width: 9rem;
      height: auto;
      margin: 0px;
      border: 1px solid transparent;
      border-radius: 1.5rem;
      padding: 0.25rem;
      object-fit: cover;
      transition: 0.5s ease-in-out;

      transform: translateZ(0);
      will-change: transform, opacity;
    }
    body > header > img.current,
    body > footer > img.current {      
      z-index: 1;
    }
  `;
  document.head.appendChild(style);

  const getImage = (index: number): FlayImage => {
    const img = new FlayImage({ magnifier: false });
    img.dataset.idx = index.toString();
    return img;
  };
  const imageAnimate = (image: HTMLImageElement, toggle: boolean, duration: number = 1000): Promise<void> => {
    const hideOpacity = 0.25;
    const keyframes = toggle ? [{ opacity: hideOpacity }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: hideOpacity }];
    return new Promise((resolve) => {
      image.animate(keyframes, { duration, easing: 'ease-in-out' }).onfinish = () => resolve();
    });
  };

  const header = (document.querySelector('body > header') ?? document.body.appendChild(document.createElement('header'))) as HTMLDivElement;
  const footer = (document.querySelector('body > footer') ?? document.body.appendChild(document.createElement('footer'))) as HTMLDivElement;

  const startIndex = Math.floor(Math.random() * imageLength);
  let offset = 0;

  let showCondition = true;
  do {
    const headerIndex = startIndex - offset >= 0 ? startIndex - offset : startIndex + offset;
    const footerIndex = startIndex + offset < imageLength ? startIndex + offset : startIndex - offset;

    const imageOfHeader = getImage(headerIndex);
    const imageOfFooter = getImage(footerIndex);
    header.prepend(imageOfHeader);
    footer.append(imageOfFooter);

    await Promise.all([imageAnimate(imageOfHeader, true), imageAnimate(imageOfFooter, true)]);

    const { right } = imageOfFooter.getBoundingClientRect();
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

    const imageOfHeader = headerImages[backIndex];
    const imageOfFooter = footerImages[index];

    imageOfHeader.classList.add('current');
    imageOfFooter.classList.add('current');

    await Promise.all([imageAnimate(imageOfHeader, false, 300), imageAnimate(imageOfFooter, false, 300)]);
    imageOfHeader.dataset.idx = (startIndex - offset).toString();
    imageOfFooter.dataset.idx = (startIndex + offset).toString();
    await Promise.all([imageAnimate(imageOfHeader, true, 700), imageAnimate(imageOfFooter, true, 700)]);

    imageOfHeader.classList.remove('current');
    imageOfFooter.classList.remove('current');

    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms 대기
    offset++;
  } while (loopCondition);
});
