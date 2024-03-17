import './init/Page';
import './page.develop.scss';

import FlayDevelop from './develop/FlayDevelop';
import * as DragDrop from './lib/Drag&Drop';
import { getRandomInt } from './util/randomNumber';

const opusList = [];
const opusIndexes = [];
const getRandomOpus = () => {
  if (opusIndexes.length === 0) opusIndexes.push(...Array.from({ length: opusList.length }, (v, i) => i));
  return opusList[opusIndexes.splice(getRandomInt(0, opusIndexes.length), 1)[0]];
};

fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
  .then((res) => res.json())
  .then((list) => opusList.push(...list));

function start() {
  appendDevelop().then(removeDevelop);
}

async function appendDevelop() {
  const opus = getRandomOpus();
  const flayDevelop = new FlayDevelop(opus);
  await flayDevelop.ready();

  const article = document.querySelector('article');
  const width = 600;
  const height = parseInt((width * 269) / 400);

  const left = getRandomInt(0, article.offsetWidth - width);
  const top = getRandomInt(0, article.offsetHeight - height);

  flayDevelop.style.position = 'absolute';
  flayDevelop.style.width = width + 'px';
  flayDevelop.style.left = left + 'px';
  flayDevelop.style.top = top + 'px';

  article.append(flayDevelop);

  DragDrop.setMoveable(flayDevelop);
}

function removeDevelop() {
  const nodeList = document.querySelectorAll('article flay-develop');
  for (let i = 0; i < nodeList.length - 5; i++) {
    nodeList[i].remove();
  }
}

document.addEventListener('wheel', start);

// fill dropzone
document.querySelectorAll('.dropzone-wrapper').forEach((wrapper) => {
  for (let i = 0; i < 7; i++) {
    const dropzone = wrapper.appendChild(document.createElement('div'));
    dropzone.classList.add('dropzone');
  }
});

document.querySelectorAll('.dropzone').forEach(DragDrop.setDropzone);
