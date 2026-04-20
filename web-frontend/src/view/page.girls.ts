import './inc/Page';
import './page.girls.scss';

import(/* webpackChunkName: "ActressFlaySummary" */ '@flay/panel/ActressFlaySummary')
  .then(({ ActressFlaySummary }) => new ActressFlaySummary())
  .then((actressFlaySummary) => document.querySelector('body > main')!.appendChild(actressFlaySummary))
  .catch(console.error);
