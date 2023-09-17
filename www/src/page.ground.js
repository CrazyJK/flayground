import FlayCondition from './elements/page/FlayCondition';
import FlayPage from './elements/page/FlayPage';
import FlayPagination from './elements/page/FlayPagination';
import './page.ground.scss';
import './util/flay.sse';

import SideNavBar from './elements/page/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

const flayPage = new FlayPage();
const flayPagination = new FlayPagination((opus) => renderFlayPage(opus));
const flayCondition = new FlayCondition((list) => flayPagination.set(list));

document.querySelector('body > main > header').appendChild(flayCondition);
document.querySelector('body > main > article').appendChild(flayPage);
document.querySelector('body > main > footer').appendChild(flayPagination);

function renderFlayPage(opus) {
  if (!document.startViewTransition) {
    flayPage.set(opus);
  } else {
    document.startViewTransition(() => flayPage.set(opus));
  }
}

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
