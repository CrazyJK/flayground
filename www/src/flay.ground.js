import FlayBatch from './components/FlayBatch';
import FlayCandidate from './components/FlayCandidate';
import FlayCondition from './components/FlayCondition';
import FlayNav from './components/FlayNav';
import FlayPage from './components/FlayPage';
import FlayPagination from './components/FlayPagination';
import FlaySearch from './components/FlaySearch';
import './flay.ground.scss';
import './util/flay.sse';

const flayNav = new FlayNav((menu) => changeMenu(menu));
const flayPage = new FlayPage();
const flayPagination = new FlayPagination((opus) => renderFlayPage(opus));
const flayCondition = new FlayCondition((list) => flayPagination.set(list));

const ASIDE = document.querySelector('body > main > aside');
const LAYER = document.querySelector('body > main > aside > #layer');

document.querySelector('body > nav').appendChild(flayNav);
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

function changeMenu(menu) {
  console.log('[changeMenu]', menu);
  LAYER.textContent = null;
  switch (menu) {
    case 'page':
      ASIDE.style.display = 'none';
      flayPagination.on();
      break;
    case 'search':
      LAYER.appendChild(new FlaySearch());
      ASIDE.style.display = 'block';
      flayPagination.off();
      break;
    case 'batch':
      LAYER.appendChild(new FlayBatch());
      ASIDE.style.display = 'block';
      flayPagination.off();
      break;
    case 'candidate':
      LAYER.appendChild(new FlayCandidate());
      ASIDE.style.display = 'block';
      flayPagination.off();
      break;
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
