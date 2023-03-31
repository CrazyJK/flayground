import FlayActress from './components/FlayActress';
import FlayCover from './components/FlayCover';
import FlayFiles from './components/FlayFiles';
import FlayOpus from './components/FlayOpus';
import FlayRank from './components/FlayRank';
import FlayRelease from './components/FlayRelease';
import FlayStudio from './components/FlayStudio';
import FlayTag from './components/FlayTag';
import FlayTitle from './components/FlayTitle';
import './index.scss';
import './scss/style.scss';

const NEXT = 'NEXT';
const PREV = 'PREV';
const RANDOM = 'RANDOM';

// components
let flayCover, flayStudio, flayOpus, flayTitle, flayRelease, flayActress, flayFiles, flayRank, flayTag;

let params = {
  sort: 'RELEASE',
};

let opusIndex = -1;
let opusList = [];

Promise.all([fetchOpusList()])
  .then(([opusValues]) => {
    console.log('promise.all', opusValues);
    // set data
    opusList = opusValues;

    // initiate Elements
    initiateComponents();

    // event
    addEventListener();

    // start
    navigator(NEXT);
  })
  .catch((error) => {
    console.error('Error:', error);
  });

async function fetchOpusList() {
  return await fetch('/flay/list/opus', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  }).then((res) => res.json());
}

function initiateComponents() {
  // cover
  const coverElement = document.querySelector('.cover');
  coverElement.textContent = null;
  flayCover = coverElement.appendChild(new FlayCover());

  // studio
  const studioElement = document.querySelector('.studio');
  studioElement.textContent = null;
  flayStudio = studioElement.appendChild(new FlayStudio());

  // opus
  const opusElement = document.querySelector('.opus');
  opusElement.textContent = null;
  flayOpus = opusElement.appendChild(new FlayOpus());

  // title
  const titleElement = document.querySelector('.title');
  titleElement.textContent = null;
  flayTitle = titleElement.appendChild(new FlayTitle());

  // release
  const releaseElement = document.querySelector('.release');
  releaseElement.textContent = null;
  flayRelease = releaseElement.appendChild(new FlayRelease());

  // actress
  const actressElement = document.querySelector('.actress');
  actressElement.textContent = null;
  flayActress = actressElement.appendChild(new FlayActress());

  // files, play
  const filesElement = document.querySelector('.files');
  filesElement.textContent = null;
  flayFiles = filesElement.appendChild(new FlayFiles());

  // rank, like
  const rankElement = document.querySelector('.rank');
  rankElement.textContent = null;
  flayRank = rankElement.appendChild(new FlayRank());

  // tag
  const tagElement = document.querySelector('.tag');
  tagElement.textContent = null;
  flayTag = tagElement.appendChild(new FlayTag());

  // history
  const historyElement = document.querySelector('.history');
}

function addEventListener() {
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

  // Fallback for browsers that don't support View Transitions:
  if (!document.startViewTransition) {
    renderFlay(opus);
    return;
  }

  // With View Transitions:
  const transition = document.startViewTransition(() => renderFlay(opus));
  console.log('transition', transition);
}

function renderFlay(opus) {
  // fetch flay
  fetch('/flay/' + opus + '/fully')
    .then((res) => res.json())
    .then((fullyFlay) => {
      console.log('data', fullyFlay);
      const { actress, flay } = fullyFlay;

      flayOpus.set(flay);
      flayCover.set(flay);
      flayStudio.set(flay);
      flayTitle.set(flay);
      flayRelease.set(flay);
      flayActress.set(flay, actress);
      flayFiles.set(flay);
      flayRank.set(flay);
      flayTag.set(flay);
      // history
    });
}
