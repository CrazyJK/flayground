import './lib/SseConnector';
import './nav/appendSideNavBar';
import './page.flay-grid.scss';
import SVG from './svg/svg.json';
import { getRandomInt } from './util/randomNumber';

const MAIN = document.querySelector('main');
const opusList = [];
const opusIndexes = [];
const condition = { rank: [0, 1, 2, 3, 4, 5] };
const getRandomOpus = () => {
  if (opusIndexes.length === 0) opusIndexes.push(...Array.from({ length: opusList.length }, (v, i) => i));
  return opusList[opusIndexes.splice(getRandomInt(0, opusIndexes.length), 1)[0]];
};
const showCover = async () => {
  const opus = getRandomOpus();

  const res = await fetch('/static/cover/' + opus + '/withData');
  const data = res.headers.get('Data');
  const dataDecoded = decodeURIComponent(data.replace(/\+/g, ' '));
  const flay = JSON.parse(dataDecoded);

  const coverBlob = await res.blob();
  const coverURL = URL.createObjectURL(coverBlob);

  // const info = `● ${flay.studio}\n● ${flay.opus}\n● ${flay.title}\n● ${flay.actressList.join(',')}\n● ${flay.release}\n● Rank: ${flay.video.rank}`;

  MAIN.appendChild(document.createElement('div')).innerHTML = `
    <div style="background-image: url(${coverURL})">
      <label>
        ${SVG.rank[flay.video.rank + 1]}
        <a data-opus="${flay.opus}">${flay.title}</a>
      </label>
    </div>
  `;
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

document.addEventListener('click', (e) => {
  const opus = e.target.dataset.opus;
  if (opus) {
    window.open('popup.flay.html?opus=' + opus, 'popup.' + opus, 'width=800px,height=1280px');
  }
});
