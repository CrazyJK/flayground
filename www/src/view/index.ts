import './inc/Page';
import './index.scss';

void import(/* webpackChunkName: "FacadeWebMovie" */ '@movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie())
  .then((facadeWebMovie) => document.querySelector('body > main')!.appendChild(facadeWebMovie))
  .then((facadeWebMovie) => facadeWebMovie.isEnded())
  .then(() => {
    void import(/* webpackChunkName: "FlayMarkerFloat" */ '@flay/panel/FlayMarkerFloat')
      .then(({ FlayMarkerFloat }) => new FlayMarkerFloat())
      .then((flayMarkerFloat) => document.body.appendChild(flayMarkerFloat))
      .then((flayMarkerFloat) => {
        flayMarkerFloat.addEventListener('changeFlay', (event) => {
          const { randomFlay } = (event as CustomEvent).detail;
          const element = document.body.querySelector('[data-opus="' + randomFlay.opus + '"]');
          if (element) {
            element.classList.add('highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      });

    void import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
      .then((imageCircle) => document.body.appendChild(imageCircle))
      .then((imageCircle) => {
        imageCircle.classList.add('right-bottom');
        imageCircle.addExtraStyles(`image-circle { opacity: 0.5; transition: opacity 0.3s ease-in-out; } image-circle:hover { opacity: 1; }`);
      });
  });
