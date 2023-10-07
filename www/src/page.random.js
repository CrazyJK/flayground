import FlayPage from './flay/FlayPage';
import './lib/SseConnector';
import './page.random.scss';
import { appendStyle } from './util/componentCssLoader';
import { getRandomInt } from './util/randomNumber';

appendStyle();

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

const flayPage = document.querySelector('body > main > article').appendChild(new FlayPage());
const opusList = [];
const opusIndexes = [];
const condition = { rank: [0, 1, 2, 3, 4, 5] };
const getRandomOpus = () => {
  if (opusIndexes.length === 0) opusIndexes.push(...Array.from({ length: opusList.length }, (v, i) => i));
  return opusList[opusIndexes.splice(getRandomInt(0, opusIndexes.length), 1)[0]];
};
const showFlay = () => {
  document.startViewTransition(() => {
    flayPage.set(getRandomOpus()).then(() => {
      flayPage.style.opacity = 1;
    });
  });
};

document.querySelector('body > main > header > button').addEventListener('click', showFlay);

fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(condition) })
  .then((res) => res.json())
  .then((list) => opusList.push(...list))
  .then(showFlay);

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
