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

  const width = 800;
  const height = parseInt((width * 269) / 400);
  const top = getRandomInt(0, window.innerHeight - height);
  const left = getRandomInt(0, window.innerWidth - width);

  flayDevelop.style.position = 'absolute';
  flayDevelop.style.width = width + 'px';
  flayDevelop.style.top = top + 'px';
  flayDevelop.style.left = left + 'px';

  document.querySelector('main').append(flayDevelop);
}

function removeDevelop() {
  const nodeList = document.querySelectorAll('flay-develop');
  for (let i = 0; i < nodeList.length - 5; i++) {
    nodeList[i].remove();
  }
}

document.addEventListener('wheel', start);
