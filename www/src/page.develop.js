import FlayDevelop from './develop/FlayDevelop';
import SideNavBar from './nav/SideNavBar';
import './page.develop.scss';
import { appendStyle } from './util/componentCssLoader';
import { getRandomInt } from './util/randomNumber';

appendStyle();
document.querySelector('body').prepend(new SideNavBar());

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
  flayDevelop.setMoveable();

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
}

function removeDevelop() {
  const nodeList = document.querySelectorAll('article flay-develop');
  for (let i = 0; i < nodeList.length - 5; i++) {
    nodeList[i].remove();
  }
}

document.addEventListener('wheel', start);

window.dragged;

document.querySelectorAll('.dropzone').forEach((dropzone) => {
  dropzone.addEventListener(
    'dragover',
    (event) => {
      // prevent default to allow drop
      event.preventDefault();
    },
    false
  );

  dropzone.addEventListener('dragenter', (e) => {
    console.log(e.type, e.target);
    // highlight potential drop target when the draggable element enters it
    if (e.target.classList.contains('dropzone')) {
      e.target.classList.add('dragover');
    }
  });

  dropzone.addEventListener('dragleave', (e) => {
    console.log(e.type, e.target);
    // reset background of potential drop target when the draggable element leaves it
    if (e.target.classList.contains('dropzone')) {
      e.target.classList.remove('dragover');
    }
  });

  dropzone.addEventListener('drop', (e) => {
    console.log(e.type, e);
    // prevent default action (open as link for some elements)
    e.preventDefault();
    // move dragged element to the selected drop target
    if (e.target.classList.contains('dropzone')) {
      e.target.classList.remove('dragover');
      if (window.dragged) {
        e.target.appendChild(window.dragged);
      }
    }
  });
});
