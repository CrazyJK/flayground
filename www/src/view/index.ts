import './inc/Page';
import './index.scss';

import(/* webpackChunkName: "FacadeWebMovie" */ '@movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie({ volume: 0.3, size: '75%', endedBehavior: 'pause' }))
  .then((facadeWebMovie) => document.body.appendChild(facadeWebMovie))
  .then((facadeWebMovie) => facadeWebMovie.isEnded())
  .catch(console.error)
  .finally(() => {
    // Application is initialized
  });
