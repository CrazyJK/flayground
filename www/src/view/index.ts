import FlayMarker, { ShapeType } from '@flay/domain/FlayMarker';
import FlayFetch from '@lib/FlayFetch';
import StyleUtils from '@lib/StyleUtils';
import './inc/Page';
import './index.scss';

(async () => {
  await import(/* webpackChunkName: "FacadeWebMovie" */ '@/movie/FacadeWebMovie')
    .then(({ FacadeWebMovie }) => new FacadeWebMovie())
    .then(async (facadeWebMovie) => {
      document.querySelector('body > main').appendChild(facadeWebMovie);
      await facadeWebMovie.isEnded();
    });

  import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
    .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
    .then((imageCircle) => {
      document.head.appendChild(document.createElement('style')).textContent = `
        .image-circle { opacity: 0.5; transition: opacity 0.3s ease-in-out; }
        .image-circle:hover { opacity: 1; }`;
      imageCircle.classList.add('right-bottom');
      document.body.appendChild(imageCircle);
    });

  FlayFetch.getOpusList({}).then(async (opusList) => {
    const getRandomInfo = async () => {
      const randomPosition = (rem: number) => {
        const widthPx = StyleUtils.remToPx(rem); // Marker width
        const excludesPx = StyleUtils.remToPx(10); // 10rem in pixels
        const randomX = Math.random() * (window.innerWidth - excludesPx * 2) + excludesPx;
        const randomY = Math.random() * (window.innerHeight - excludesPx * 2) + excludesPx;
        return [Math.round(randomX - widthPx / 2), Math.round(randomY - widthPx / 2)]; // Center the marker
      };

      const randomIndex = Math.floor(Math.random() * opusList.length);
      const randomOpus = opusList[randomIndex];
      const randomFlay = await FlayFetch.getFlay(randomOpus);
      const randomRem = Math.floor(Math.random() * 3) + 2; // 2 ~ 4 randomly select a size
      const [randomX, randomY] = randomPosition(randomRem);
      const shape = ['square', 'circle', 'star', 'heart', 'rhombus'][Math.floor(Math.random() * 5)] as ShapeType;

      return { randomFlay, randomRem, randomX, randomY, shape };
    };

    const { randomFlay, randomRem, randomX, randomY, shape } = await getRandomInfo();
    const flayMarker = new FlayMarker(randomFlay, { showTitle: true, showCover: false, shape: shape });
    flayMarker.style.position = 'fixed';
    flayMarker.style.transition = '0.3s ease-in-out';
    flayMarker.style.contain = 'layout style paint';
    flayMarker.style.willChange = 'top, left, width, height';
    flayMarker.style.transform = 'translate3d(0, 0, 0)';
    flayMarker.style.left = `${randomX}px`;
    flayMarker.style.top = `${randomY}px`;
    flayMarker.style.width = `${randomRem}rem`;
    flayMarker.style.height = `${randomRem}rem`;

    document.body.appendChild(flayMarker);

    setInterval(() => {
      getRandomInfo().then(({ randomFlay, randomRem, randomX, randomY, shape }) => {
        flayMarker.set(randomFlay, { showTitle: true, showCover: false, shape: shape });
        flayMarker.style.left = `${randomX}px`;
        flayMarker.style.top = `${randomY}px`;
        flayMarker.style.width = `${randomRem}rem`;
        flayMarker.style.height = `${randomRem}rem`;
      });
    }, 1000 * 60); // Refresh every 1 minute
  });
})();
