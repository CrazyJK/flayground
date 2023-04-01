import FlayActress from './components/FlayActress';
import FlayComment from './components/FlayComment';
import FlayCover from './components/FlayCover';
import FlayFiles from './components/FlayFiles';
import FlayNavigator from './components/FlayNavigator';
import FlayOpus from './components/FlayOpus';
import FlayRank from './components/FlayRank';
import FlayRelease from './components/FlayRelease';
import FlayStudio from './components/FlayStudio';
import FlayTag from './components/FlayTag';
import FlayTitle from './components/FlayTitle';
import './index.scss';
import './scss/style.scss';
import './util/flay.sse';

// components
let flayCover, flayStudio, flayOpus, flayTitle, flayComment, flayRelease, flayActress, flayFiles, flayRank, flayTag, flayNavigator;

let params = {
  sort: 'RELEASE',
};

let opusList = [];

Promise.all([fetchOpusList()])
  .then(([opusValues]) => {
    console.debug('promise.all', opusValues);
    // set data
    opusList = opusValues;

    // initiate Elements
    initiateComponents();
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

  // comment
  const commentElement = document.querySelector('.comment');
  commentElement.textContent = null;
  flayComment = commentElement.appendChild(new FlayComment());

  // actress
  const actressElement = document.querySelector('.actress');
  actressElement.textContent = null;
  flayActress = actressElement.appendChild(new FlayActress());

  // release
  const releaseElement = document.querySelector('.release');
  releaseElement.textContent = null;
  flayRelease = releaseElement.appendChild(new FlayRelease());

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

  // flayNavigator
  flayNavigator = document.querySelector('body > footer').appendChild(new FlayNavigator());
  flayNavigator.setData(opusList);
  flayNavigator.setHandler((opus) => renderFlay(opus));
  flayNavigator.start();
}

function renderFlay(opus) {
  // fetch flay
  fetch('/flay/' + opus + '/fully')
    .then((res) => res.json())
    .then((fullyFlay) => {
      const { actress, flay } = fullyFlay;
      console.log('data', flay, actress);

      flayCover.set(flay);
      flayStudio.set(flay);
      flayOpus.set(flay);
      flayTitle.set(flay);
      flayComment.set(flay);
      flayActress.set(flay, actress);
      flayRelease.set(flay);
      flayFiles.set(flay);
      flayRank.set(flay);
      flayTag.set(flay);
      // history
    });
}

window.emitFlay = (flay) => {
  renderFlay(flay.opus);
};
window.emitVideo = (video) => {
  renderFlay(video.opus);
};
