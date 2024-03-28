import './init/Page';
import './page.flay-one.scss';

import FlayTitle from './flay/part/FlayTitle';
import { getRandomInt } from './util/randomNumber';

const main = document.querySelector('body > main');
const flayTitle = main.appendChild(new FlayTitle());

const opusList = [];
const opusIndexes = [];
const condition = { rank: [0, 1, 2, 3, 4, 5] };
const getRandomOpus = () => {
  if (opusIndexes.length === 0) opusIndexes.push(...Array.from({ length: opusList.length }, (v, i) => i));
  return opusList[opusIndexes.splice(getRandomInt(0, opusIndexes.length), 1)[0]];
};
const showFlay = async () => {
  document.startViewTransition(async () => {
    const opus = getRandomOpus();
    main.style.backgroundImage = `url(/static/cover/${opus})`;

    const { flay, actress } = await fetch(`/flay/${opus}/fully`).then((res) => res.json());

    flayTitle.set(flay);
  });
};

window.addEventListener('wheel', showFlay);

fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(condition) })
  .then((res) => res.json())
  .then((list) => opusList.push(...list))
  .then(showFlay);
