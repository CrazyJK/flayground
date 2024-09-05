import './init/Page';
import './page.flay-basket.scss';

import(/* webpackChunkName: "FlayBasket" */ './flay/FlayBasket').then(({ FlayBasket }) => {
  document.querySelector('main').appendChild(new FlayBasket());
});
