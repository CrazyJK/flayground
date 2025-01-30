import './inc/Page';
import './page.flay-play.scss';

import FlayArticle from '../flay/domain/FlayArticle';
import { FlayVideoViewPanel } from '../flay/panel/FlayVideoViewPanel';

const flayArticle = document.querySelector('body > header').appendChild(new FlayArticle({ mode: 'card' }));

document
  .querySelector('body > main')
  .appendChild(new FlayVideoViewPanel())
  .addEventListener('flay-load', (event) => {
    console.log('flay-play event', event.detail.opus, event.detail.flay, event.detail.actress);
    flayArticle.set(event.detail.flay);
  });
