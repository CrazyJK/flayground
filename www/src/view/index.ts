import './inc/Page';
import './index.scss';

void import(/* webpackChunkName: "FacadeWebMovie" */ '@movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie())
  .then((facadeWebMovie) => document.querySelector('body > main')!.appendChild(facadeWebMovie))
  .then((facadeWebMovie) => facadeWebMovie.isEnded())
  .finally(() => {
    import(/* webpackChunkName: "FlayMarkerFloat" */ '@flay/panel/FlayMarkerFloat')
      .then(({ FlayMarkerFloat }) => new FlayMarkerFloat())
      .then((flayMarkerFloat) => document.body.appendChild(flayMarkerFloat))
      .catch(console.error);

    import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
      .then((imageCircle) => document.body.appendChild(imageCircle))
      .then((imageCircle) => {
        imageCircle.classList.add('right-bottom');
        imageCircle.addExtraStyles(`image-circle { opacity: 0.5; transition: opacity 0.3s ease-in-out; } image-circle:hover { opacity: 1; }`);
      })
      .catch(console.error);
  });
