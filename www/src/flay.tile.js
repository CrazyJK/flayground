import FlayCard from './components/FlayCard';
import FlayCondition from './components/FlayCondition';
import FlayPagination from './components/FlayPagination';
import './flay.tile.scss';
import './util/flay.sse';

const flayCondition = document.querySelector('body > header').appendChild(new FlayCondition());
const flayContainer = document.querySelector('body > main');
const flayPagination = document.querySelector('body > footer').appendChild(new FlayPagination());

const SIZE = 8;

let flayCardList = [];
for (let i = 0; i < SIZE; i++) {
  let flayCard = new FlayCard();
  flayCardList.push(flayCard);
  flayContainer.appendChild(flayCard);
}

flayCondition.addEventListener('change', (e) => {
  console.log('flayCondition change', e.detail);
  fetchOpusList(e.detail);
});

fetchOpusList(flayCondition.get()).then(() => {
  flayCondition.style.opacity = 1;
  flayContainer.style.opacity = 1;
  flayPagination.style.opacity = 1;
  console.log('completed');
});

async function fetchOpusList(condition) {
  return await fetch('/flay/list/opus', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(condition),
  })
    .then((res) => res.json())
    .then((opusList) => {
      console.log('opusList', opusList);
      if (opusList.length === 0) {
        throw new Error('Notfound Opus');
      }
      flayPagination.setData(opusList);
      flayPagination.setHandler((opus) => {
        setFlayCardList();
      });
      flayPagination.start();
    });
}

window.emitFlay = (flay) => {
  setFlay(flay.opus);
};
window.emitVideo = (video) => {
  setFlay(video.opus);
};

function setFlay(opus) {
  flayCardList.forEach((flayCard) => {
    if (flayCard.getAttribute('opus') === opus) {
      flayCard.get(opus);
    }
  });
}

function setFlayCardList() {
  for (let i = 0; i < SIZE; i++) {
    let opus = flayPagination.get(Math.round(i - SIZE / 2));
    console.log('setFlayCardList', opus);
    if (opus) {
      flayCardList[i].set(opus);
    }
  }
}
