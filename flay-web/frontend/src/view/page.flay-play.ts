import FlayArticle from '@flay/domain/FlayArticle';
import { FlayVideoViewPanel } from '@flay/panel/FlayVideoViewPanel';
import './inc/Page';
import './page.flay-play.scss';

const flayArticle = document.querySelector('body > header')!.appendChild(new FlayArticle({ mode: 'card' }));

document
  .querySelector('body > main')!
  .appendChild(new FlayVideoViewPanel())
  .addEventListener('flay-load', (event: Event) => {
    const detail = (event as CustomEvent).detail;
    console.log('flay-play event', detail.opus, detail.flay, detail.actress);
    flayArticle.set(detail.flay);
  });
