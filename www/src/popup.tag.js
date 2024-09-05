import './init/Popup';
import './popup.tag.scss';

import FlayCard from './flay/FlayCard';
import FlayAction from './util/FlayAction';

window.tagList = [];
window.actressMap = new Map();

const urlParams = new URL(location.href).searchParams;
const id = urlParams.get('id');

const flayMap = new Map();

const tagId = document.querySelector('#tagId');
const tagName = document.querySelector('#tagName');
const tagDesc = document.querySelector('#tagDesc');
const saveBtn = document.querySelector('#saveBtn');
const delBtn = document.querySelector('#delBtn');
const flayRank = document.querySelector('#flayRank');

function fetchTag() {
  fetch('/info/tag/' + id)
    .then((res) => res.json())
    .then((tag) => {
      tagId.innerHTML = tag.id;
      tagName.value = tag.name;
      tagDesc.value = tag.description;

      document.title = tag.name + ' tag';
    });

  fetch('/flay/find/tag/' + id)
    .then((res) => res.json())
    .then((list) => {
      let opusList = Array.from(list).map((flay) => flay.opus);
      renderFlayCardList(opusList).then(() => {
        countFlaySizeByRank();
      });
    });
}

fetchTag();

flayRank.addEventListener('change', (e) => {
  console.log('rank change', e.target.value);
  toggleByRank(e.target.value);
});

saveBtn.addEventListener('click', () => {
  FlayAction.putTag(tagId.textContent, tagName.value, tagDesc.value);
});

delBtn.addEventListener('click', () => {
  if (confirm('A U sure?')) {
    FlayAction.deleteTag(tagId.textContent, tagName.value, tagDesc.value);
  }
});

async function renderFlayCardList(opusList) {
  document.querySelector('article').textContent = null;
  flayMap.clear();
  for (let opus of opusList) {
    let flayCard = new FlayCard({ excludes: [] });
    flayMap.set(opus, flayCard);
    document.querySelector('article').appendChild(flayCard);
    await flayCard.set(opus);

    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function toggleByRank(selectedRank) {
  document.querySelectorAll('flay-card').forEach((flayCard) => {
    if (selectedRank === '') {
      flayCard.style.display = 'block';
    } else {
      let rank = flayCard.getAttribute('rank');
      if (rank === selectedRank) {
        flayCard.style.display = 'block';
      } else {
        flayCard.style.display = 'none';
      }
    }
  });
}

function countFlaySizeByRank() {
  let flaySizeByRank = [0, 0, 0, 0, 0, 0];
  let sumRank = 0;
  let totalFlay = 0;
  document.querySelectorAll('flay-card').forEach((flayCard, key, parent) => {
    let rank = parseInt(flayCard.getAttribute('rank'));
    flaySizeByRank[rank] += 1;
    if (rank !== 0) {
      sumRank += rank;
      totalFlay++;
    }
    flaySizeByRank.forEach((flaySize, r) => {
      document.querySelector(`#flayRank option[value="${r}"]`).innerHTML = `Rank ${r} : ${flaySize}`;
    });
    document.querySelector(`#flayRank option:first-child`).innerHTML = `Rank ${(sumRank / totalFlay).toFixed(1)} : ${totalFlay} F`;
  });
}

// sse 수신 이벤트
window.emitTag = (tag) => {
  if (id === tag.id) fetchTag();
};
