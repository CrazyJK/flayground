import './inc/Page';
import './index.scss';

import(/* webpackChunkName: "FacadeWebMovie" */ '@movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie())
  .then((facadeWebMovie) => document.body.appendChild(facadeWebMovie))
  .then((facadeWebMovie) => facadeWebMovie.isEnded())
  .catch(console.error)
  .finally(() => {
    // Application is initialized

    import(/* webpackChunkName: "ActressFlaySummary" */ '@flay/panel/ActressFlaySummary')
      .then(({ ActressFlaySummary }) => new ActressFlaySummary())
      .then((actressFlaySummary) => document.body.appendChild(actressFlaySummary))
      .catch(console.error);
  });
