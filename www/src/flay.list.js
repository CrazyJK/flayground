import FlayCondition from './components/FlayCondition';
import FlayOne from './components/FlayOne';
import FlayPagination from './components/FlayPagination';
import './flay.list.scss';
import './util/flay.sse';

const flayCondition = document.querySelector('body > header').appendChild(new FlayCondition());
const flayOne = document.querySelector('body > main').appendChild(new FlayOne());
const flayPagination = document.querySelector('body > footer').appendChild(new FlayPagination());

flayCondition.addEventListener('change', (e) => {
  console.log('flayCondition change', e.detail);
  fetchOpusList(e.detail);
});

fetchOpusList(flayCondition.get()).then(() => {
  console.log('completed');
  flayCondition.style.opacity = 1;
  flayOne.style.opacity = 1;
  flayPagination.style.opacity = 1;
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
      flayPagination.setHandler((opus) => flayOne.set(opus));
      flayPagination.start();
    });
}

window.emitFlay = (flay) => {
  flayOne.set(flay.opus);
};
window.emitVideo = (video) => {
  flayOne.set(video.opus);
};
