import './init/Page';
import './page.flay-one.scss';

import FlayPage from './flay/FlayPage';
import { getRandomInt } from './util/randomNumber';

const flayPage = document.querySelector('body > main > article').appendChild(new FlayPage());
const opusList = [];
const opusIndexes = [];
const condition = { rank: [0, 1, 2, 3, 4, 5] };
const getRandomOpus = () => {
  if (opusIndexes.length === 0) opusIndexes.push(...Array.from({ length: opusList.length }, (v, i) => i));
  return opusList[opusIndexes.splice(getRandomInt(0, opusIndexes.length), 1)[0]];
};
const showFlay = () => {
  document.startViewTransition(() => {
    flayPage.set(getRandomOpus()).then(() => {
      flayPage.style.opacity = 1;
    });
  });
};

document.querySelector('body > main > header > button').addEventListener('click', showFlay);

fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(condition) })
  .then((res) => res.json())
  .then((list) => opusList.push(...list))
  .then(showFlay);
