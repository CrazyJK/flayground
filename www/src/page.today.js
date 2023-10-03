import './lib/SseConnector';
import './page.today.scss';
import { getRandomInt } from './util/randomNumber';

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

const opusList = [];
const opusIndexes = [];
const condition = { rank: [0, 1, 2, 3, 4, 5] };
const getRandomOpus = () => {
  if (opusIndexes.length === 0) opusIndexes.push(...Array.from({ length: opusList.length }, (v, i) => i));
  return opusList[opusIndexes.splice(getRandomInt(0, opusIndexes.length), 1)[0]];
};
const MAIN = document.querySelector('main');
const showCover = async () => {
  const opus = getRandomOpus();

  const res = await fetch('/static/cover/' + opus + '/withData');
  const data = res.headers.get('Data');
  const dataDecoded = decodeURIComponent(data.replace(/\+/g, ' '));
  const flay = JSON.parse(dataDecoded);

  const coverBlob = await res.blob();
  const coverURL = URL.createObjectURL(coverBlob);

  const outer = MAIN.appendChild(document.createElement('div'));
  outer.title = `● ${flay.studio}\n● ${flay.opus}\n● ${flay.title}\n● ${flay.actressList.join(',')}\n● ${flay.release}\n● Rank: ${flay.video.rank}`;

  const inner = outer.appendChild(document.createElement('div'));
  inner.style.backgroundImage = `url(${coverURL})`;
  inner.addEventListener('click', () => {
    window.open('popup.flay.html?opus=' + opus, 'popup.' + opus, 'width=800px,height=1280px');
  });
};
const start = async () => {
  for (let i = 0; i < 16; i++) {
    showCover();
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(condition) })
  .then((res) => res.json())
  .then((list) => opusList.push(...list))
  .then(start);

window.addEventListener('scroll', function () {
  const isScrollAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
  if (isScrollAtBottom) {
    console.log('scroll at bottom');
    start();
  }
});
