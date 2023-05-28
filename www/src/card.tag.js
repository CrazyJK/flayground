import './card.tag.scss';
import FlayCard from './elements/card/FlayCard';
import flayAction from './util/flay.action';
import './util/flay.sse';
import './util/theme.listener';
import { addResizeLazyEventListener } from './util/windowResize';

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
  flayAction.putTag(tagId.textContent, tagName.value, tagDesc.value);
});

delBtn.addEventListener('click', () => {
  if (confirm('A U sure?')) {
    flayAction.deleteTag(tagId.textContent, tagName.value, tagDesc.value);
  }
});

addResizeLazyEventListener(() => {
  flayMap.forEach((flayCard) => {
    flayCard.resize();
  });
});

async function renderFlayCardList(opusList) {
  document.querySelector('article').textContent = null;
  flayMap.clear();
  for (let opus of opusList) {
    let flayCard = new FlayCard({ excludes: ['FlayActress', 'FlayTag'] });
    flayMap.set(opus, flayCard);
    document.querySelector('article').appendChild(flayCard);
    flayCard.set(opus);

    await new Promise((resolve) => setTimeout(resolve, 200));
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
  document.querySelectorAll('flay-card').forEach((flayCard, key, parent) => {
    let rank = parseInt(flayCard.getAttribute('rank'));
    flaySizeByRank[rank] += 1;

    flaySizeByRank.forEach((flaySize, r) => {
      document.querySelector(`#flayRank option[value="${r}"]`).innerHTML = `Rank ${r} : ${flaySize}`;
    });
    document.querySelector(`#flayRank option:first-child`).innerHTML = `Rank : ${parent.length}`;
  });
}

window.emitFlay = (flay) => {
  let flayCard = flayMap.get(flay.opus);
  if (flayCard) flayCard.reload();
};
window.emitStudio = (studio) => {
  flayMap.forEach((flayCard) => {
    if (flayCard.flay.studio === studio.name) flayCard.reload();
  });
};
window.emitVideo = (video) => {
  let flayCard = flayMap.get(video.opus);
  if (flayCard) flayCard.reload();
};
window.emitActress = (actress) => {
  fetchTag();
};
window.emitTag = (tag) => {
  if (id === tag.id) fetchTag();
};
