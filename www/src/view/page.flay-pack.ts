import './inc/Page';
import './page.flay-pack.scss';

import(/* webpackChunkName: "FlayPackPanel" */ '@flay/panel/FlayPackPanel')
  .then(({ FlayPackPanel }) => new FlayPackPanel())
  .then((flayPackPanel) => {
    document.body.appendChild(flayPackPanel);
  });
