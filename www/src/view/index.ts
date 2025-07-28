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

  FlayFetch.getOpusList({}).then((opusList) => {
    const showMarker = async () => {
      const randomPosition = (rem: number) => {
        const widthPx = StyleUtils.remToPx(rem); // Marker width
        const excludesPx = StyleUtils.remToPx(10); // 10rem in pixels
        const randomX = Math.random() * (window.innerWidth - excludesPx * 2) + excludesPx;
        const randomY = Math.random() * (window.innerHeight - excludesPx * 2) + excludesPx;
        return [Math.round(randomX - widthPx / 2), Math.round(randomY - widthPx / 2)]; // Center the marker
      };
      const markerAnimate = (marker: Element, toggle: boolean, duration: number = 300) => {
        marker.animate(
          {
            transform: toggle ? ['scale(0.1)', 'scale(0.3)', 'scale(0.5)', 'scale(0.9)', 'scale(1.1)', 'scale(1)'] : ['scale(1)', 'scale(0.1)'],
            opacity: toggle ? [0, 1] : [1, 0],
          },
          {
            duration: duration,
            easing: 'ease-in-out',
            fill: 'forwards',
          }
        ).onfinish = () => (toggle ? null : marker.remove());
      };

      const randomIndex = Math.floor(Math.random() * opusList.length);
      const randomOpus = opusList[randomIndex];
      const randomFlay = await FlayFetch.getFlay(randomOpus);
      const randomRem = Math.floor(Math.random() * 3) + 2; // 2 ~ 4 randomly select a size
      const [randomX, randomY] = randomPosition(randomRem);

      const shape = ['square', 'circle', 'star', 'heart', 'rhombus'][Math.floor(Math.random() * 5)] as ShapeType;
      const flayMarker = new FlayMarker(randomFlay, { showTitle: true, showCover: false, shape: shape });
      flayMarker.style.cssText = `
          position: fixed;
          left: ${randomX}px;
          top: ${randomY}px;
          width: ${randomRem}rem;
          height: ${randomRem}rem;
          transform: scale(0.1);
        `;

      document.querySelectorAll('.flay-marker').forEach((marker) => markerAnimate(marker, false));
      document.body.appendChild(flayMarker);
      markerAnimate(flayMarker, true);
    };

    setInterval(showMarker, 1000 * 60); // Refresh every 1 minute
    showMarker();
  });
})();
