import './inc/Page';
import './page.flay-basket.scss';

import(/* webpackChunkName: "FlayBasket" */ '../flay/panel/FlayBasket').then(({ FlayBasket }) => {
  document.querySelector('main').appendChild(new FlayBasket());
});
