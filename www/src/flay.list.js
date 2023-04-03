import FlayCondition from './components/FlayCondition';
import FlayNavigator from './components/FlayNavigator';
import FlayOne from './components/FlayOne';
import './flay.list.scss';
import './util/flay.sse';

const flayCondition = document.querySelector('body > header').appendChild(new FlayCondition());
const flayOne = document.querySelector('body > main').appendChild(new FlayOne());
const flayNavigator = document.querySelector('body > footer').appendChild(new FlayNavigator());

flayCondition.addEventListener('change', (e) => {
  console.log('flayCondition change', e.detail);
  fetchOpusList(e.detail);
});

fetchOpusList(flayCondition.get());

function fetchOpusList(condition) {
  fetch('/flay/list/opus', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(condition),
  })
    .then((res) => res.json())
    .then((opusList) => {
      console.log('opusList', opusList);
      if (opusList.length === 0) {
        throw new Error('Notfound Opus');
      }
      flayNavigator.setData(opusList);
      flayNavigator.setHandler((opus) => flayOne.set(opus));
      flayNavigator.start();
    })
    .then(() => {
      console.log('completed');
      flayCondition.style.opacity = 1;
      flayOne.style.opacity = 1;
      flayNavigator.style.opacity = 1;
    });
}

window.emitFlay = (flay) => {
  flayOne.set(flay.opus);
};
window.emitVideo = (video) => {
  flayOne.set(video.opus);
};
