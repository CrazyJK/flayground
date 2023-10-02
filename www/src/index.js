import FlayPage from './flay/FlayPage';
import './index.scss';
import './util/flay.sse';
import { getRandomInt } from './util/random';

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

const flayPage = new FlayPage();
document.querySelector('body > main > article').appendChild(flayPage);

document.querySelector('body > main > header > button').addEventListener('click', showFlay);

let opusList;
let condition = {
  search: null,
  withSubtitles: false,
  withFavorite: false,
  withNoFavorite: false,
  rank: [0, 1, 2, 3, 4, 5],
  sort: 'RELEASE',
};

fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(condition) })
  .then((res) => res.json())
  .then((list) => (opusList = list))
  .then(showFlay);

function showFlay() {
  let randomIndex = getRandomInt(0, opusList.length);
  document.startViewTransition(() => {
    flayPage.set(opusList[randomIndex]).then(() => {
      flayPage.style.opacity = 1;
    });
  });
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
