import './init/Page';
import './page.flay-page.scss';

import FlayPage from './flay/FlayPage';
import FlayCondition from './flay/page/FlayCondition';
import FlayPagination from './flay/page/FlayPagination';

const flayCondition = new FlayCondition();
const flayPage = new FlayPage();
const flayPagination = new FlayPagination();

flayCondition.addEventListener('change', (e) => {
  console.debug('flayCondition', e.type, e.detail.list, e);
  flayPagination.set(e.detail.list);
});

flayPagination.addEventListener('change', (e) => {
  console.debug('flayPagination', e.type, e.target.opus, e);
  if (!document.startViewTransition) {
    flayPage.set(e.target.opus);
  } else {
    document.startViewTransition(() => flayPage.set(e.target.opus));
  }
});

document.querySelector('body > main > header').appendChild(flayCondition);
document.querySelector('body > main > article').appendChild(flayPage);
document.querySelector('body > main > footer').appendChild(flayPagination);

window.emitFlay = (flay) => {
  if (flayPage.opus === flay.opus) flayPage.reload();
};
window.emitStudio = (studio) => {
  if (flayPage.flay.studio === studio.name) flayPage.reload();
};
window.emitVideo = (video) => {
  if (flayPage.opus === video.opus) flayPage.reload();
};
window.emitActress = (actress) => {
  if (Array.from(flayPage.flay.actressList).filter((name) => name === actress.name).length > 0) flayPage.reload();
};
window.emitTag = (tag) => {
  flayPage.reload();
};
