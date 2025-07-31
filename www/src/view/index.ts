import './inc/Page';
import './index.scss';

await import(/* webpackChunkName: "FacadeWebMovie" */ '@movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie())
  .then(async (facadeWebMovie) => {
    document.querySelector('body > main').appendChild(facadeWebMovie);
    await facadeWebMovie.isEnded();
  })
  .then(() => {
    import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
      .then((imageCircle) => {
        document.head.appendChild(document.createElement('style')).textContent = `
        .image-circle { opacity: 0.5; transition: opacity 0.3s ease-in-out; }
        .image-circle:hover { opacity: 1; }`;
        imageCircle.classList.add('right-bottom');
        document.body.appendChild(imageCircle);
      });

    import(/* webpackChunkName: "FlayMarkerFloat" */ '@flay/panel/FlayMarkerFloat')
      .then(({ FlayMarkerFloat }) => new FlayMarkerFloat())
      .then((flayMarkerFloat) => {
        document.body.appendChild(flayMarkerFloat);
      });
  });
