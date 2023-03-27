import FlayActress from './components/FlayActress';
import FlayCover from './components/FlayCover';
import FlayFiles from './components/FlayFiles';
import FlayOpus from './components/FlayOpus';
import FlayRank from './components/FlayRank';
import FlayRelease from './components/FlayRelease';
import FlayStudio from './components/FlayStudio';
import FlayTitle from './components/FlayTitle';
import './index.scss';
import './scss/style.scss';

const NEXT = 'NEXT',
  PREV = 'PREV',
  RANDOM = 'RANDOM';

let opusList = [];
let opusIndex = 0;

let params = {
  sort: 'RELEASE',
};

fetch('/flay/list/opus', {
  method: 'post',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(params),
})
  .then((response) => response.json())
  .then((data) => {
    console.log('Success:', data);
    opusList = Array.from(data);

    window.addEventListener('wheel', (e) => {
      console.log('wheel', e.deltaY, e);
      switch (e.deltaY) {
        case 100: // wheel down
          navigator(NEXT);
          break;
        case -100: // wheel up
          navigator(PREV);
          break;
        default:
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      console.log('keyup', e.code, e);
      switch (e.code) {
        case 'ArrowRight':
          navigator(NEXT);
          break;
        case 'ArrowLeft':
          navigator(PREV);
          break;
        case 'Space':
          navigator(RANDOM);
          break;
        default:
          break;
      }
    });

    navigator(RANDOM);
  })
  .catch((error) => {
    console.error('Error:', error);
  });

async function fetchFlay(opus) {
  return await fetch('/flay/' + opus).then((res) => res.json());
}

async function fetchFullyFlay(opus) {
  return await fetch('/flay/' + opus + '/fully').then((res) => res.json());
}

function navigator(direction) {
  switch (direction) {
    case NEXT:
      opusIndex += 1;
      break;
    case PREV:
      opusIndex -= 1;
      break;
    case RANDOM:
      opusIndex = Math.floor(Math.random() * opusList.length);
      break;
    default:
      throw new Error('unknown direction');
  }

  let opus = opusList[opusIndex];
  renderFlay(opus);
}

function renderFlay(opus) {
  // fetch flay
  fetchFullyFlay(opus).then((data) => {
    console.log('data', data);
    const { actress, flay } = data;
    console.log('flay', flay);
    console.log('actress', actress);

    // studio
    const studioElement = document.querySelector('.studio');
    studioElement.textContent = null;
    studioElement.appendChild(new FlayStudio(flay.studio, flay.opus));

    // title
    const titleElement = document.querySelector('.title');
    titleElement.textContent = null;
    titleElement.appendChild(new FlayTitle(flay.title, flay.opus));

    // release
    const releaseElement = document.querySelector('.release');
    releaseElement.textContent = null;
    releaseElement.appendChild(new FlayRelease(flay.release, opus));

    // actress
    const actressElement = document.querySelector('.actress');
    actressElement.textContent = null;
    Array.from(actress).forEach((actress) => {
      actressElement.appendChild(new FlayActress(actress, opus));
    });

    // files, play
    const filesElement = document.querySelector('.files');
    filesElement.textContent = null;
    filesElement.appendChild(new FlayFiles(flay.files, opus));

    // rank, like
    const rankElement = document.querySelector('.rank');
    rankElement.textContent = null;
    rankElement.appendChild(new FlayRank(flay.video, opus));

    // tag
    const tagElement = document.querySelector('.tag');
    // tagElement.textContent = null;
  });

  // opus
  const opusElement = document.querySelector('.opus');
  opusElement.textContent = null;
  opusElement.appendChild(new FlayOpus(opus));

  // cover
  const coverElement = document.querySelector('.cover');
  coverElement.textContent = null;
  coverElement.appendChild(new FlayCover(opus));
}
