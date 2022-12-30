import './components/FlayMenu';
import { LocalStorageItem } from './lib/crazy.common';
import { Rest } from './lib/flay.rest.service';
import { View } from './lib/flay.utils';

import './flay.cover.flow.scss';
import './styles/common.scss';

const WRAP = document.querySelector('#coverFlow');
const COLUMN_WIDTH = 500;
const INTERVAL = 1000 * 3;

let timer = null;

LocalStorageItem.get('flay.cover.flow.rank', '')
  .split(',')
  .forEach((r) => {
    if (r !== '') document.querySelector('#rank' + r).checked = true;
  });

window.addEventListener('resize', resizeColumn);
window.dispatchEvent(new Event('resize'));

document.querySelectorAll('nav input, nav select').forEach((element) => {
  element.addEventListener('change', startFlow);
});
document.querySelector('#searchInput').dispatchEvent(new Event('change'));

function resizeColumn() {
  let calcuratedColCount = Math.floor(window.innerWidth / COLUMN_WIDTH);
  let currColumnCount = WRAP.childElementCount;
  console.debug('colCount', calcuratedColCount, currColumnCount);

  if (calcuratedColCount < currColumnCount) {
    // remove col
    for (let i = 0; i < currColumnCount - calcuratedColCount; i++) {
      WRAP.removeChild(WRAP.lastChild);
    }
  } else if (calcuratedColCount > currColumnCount) {
    // add col
    for (let i = 0; i < calcuratedColCount - currColumnCount; i++) {
      const column = document.createElement('div');
      column.setAttribute('class', 'col');
      WRAP.appendChild(column);
    }
  }
}

function flowCover(list) {
  document.querySelector('#searchResultDisplay').innerHTML = list.length + ' Flay';

  const coverSize = list.length;
  const seenIndex = [];

  clearInterval(timer);

  if (list.length === 0) {
    return;
  }

  timer = setInterval(() => {
    let colCount = WRAP.childElementCount;
    let colNodes = WRAP.children;
    let selectedIndex = Math.floor(Math.random() * colCount) % colCount;
    let selectedCol = colNodes[selectedIndex];
    console.debug('selected', selectedIndex, selectedCol);

    const cover = new Image();
    cover.onload = () => {
      let nw = cover.naturalWidth;
      let nh = cover.naturalHeight;
      let iw = (window.innerWidth - 16 * 4) / colCount;
      let ih = (iw * nh) / nw;
      console.debug('cover', nw, nh, iw, ih);

      cover.animate([{ height: '0px' }, { height: ih + 'px' }], {
        duration: 400,
        iterations: 1,
      });

      selectedCol.prepend(cover);
    };
    cover.addEventListener('click', (e) => {
      const opus = e.target.src.split('/').pop();
      View.flay(opus);
    });

    let randomIndex = -1;
    do {
      if (seenIndex.length === coverSize) {
        seenIndex.length = 0;
        console.log('Array seenIndex set empty');
      }
      randomIndex = Math.floor(Math.random() * coverSize) % coverSize;
    } while (seenIndex.includes(randomIndex));
    seenIndex.push(randomIndex);
    cover.src = '/static/cover/' + list[randomIndex];

    // remove overflow cover
    for (let col of colNodes) {
      const coverLength = col.children.length;
      if (coverLength > 9) {
        col.lastChild.remove();
      }
      console.debug('cover length', col.children.length);
    }
  }, INTERVAL);
}

function startFlow() {
  const condition = {
    search: document.querySelector('#searchInput').value,
    rank: Array.from(document.querySelectorAll('input[name="rank"]:checked')).map((element) => Number(element.value)),
    withSubtitles: document.querySelector('#withSubtitles').checked,
    withFavorite: document.querySelector('#withFavorite').checked,
    withNoFavorite: document.querySelector('#withNoFavorite').checked,
    sort: document.querySelector('#sort').value,
  };

  LocalStorageItem.set('flay.cover.flow.rank', condition.rank);

  Rest.Flay.listOfOpus(condition, flowCover);
}
