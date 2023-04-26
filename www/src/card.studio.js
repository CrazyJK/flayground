import './card.studio.scss';
import FlayCard from './elements/card/FlayCard';
import flayAction from './util/flay.action';
import './util/flay.sse';

const urlParams = new URL(location.href).searchParams;
const name = urlParams.get('name');

const flayMap = new Map();

const studioName = document.querySelector('#studioName');
const studioCompany = document.querySelector('#studioCompany');
const studioHomepage = document.querySelector('#studioHomepage');
const flayRank = document.querySelector('#flayRank');
const saveBtn = document.querySelector('#saveBtn');

function fetchStudio() {
  fetch('/info/studio/' + name)
    .then((res) => res.json())
    .then((studio) => {
      studioName.value = studio.name;
      studioCompany.value = studio.company;
      studioHomepage.value = studio.homepage;

      document.title = studio.name + ' tag';
    });

  fetch('/flay/find/studio/' + name)
    .then((res) => res.json())
    .then((list) => {
      let opusList = Array.from(list).map((flay) => flay.opus);
      renderFlayCardList(opusList).then(() => {
        countFlaySizeByRank();
      });
    });
}

fetchStudio();

flayRank.addEventListener('change', (e) => {
  console.log('rank change', e.target.value);
  toggleByRank(e.target.value);
});

saveBtn.addEventListener('click', () => {
  flayAction.putStudio(studioName.value, studioCompany.value, studioHomepage.value);
});

async function renderFlayCardList(opusList) {
  document.querySelector('article').textContent = null;
  flayMap.clear();
  for (let opus of opusList) {
    let flayCard = new FlayCard({ excludes: ['FlayStudio', 'FlayTag'] });
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
  if (name === studio.name) fetchStudio();
};
window.emitVideo = (video) => {
  let flayCard = flayMap.get(video.opus);
  if (flayCard) flayCard.reload();
};
window.emitActress = (actress) => {
  fetchStudio();
};

/**
 * Storage change Listener
 */
onstorage = (e) => {
  console.log('onstorage', e.key, e.oldValue, e.newValue);
  if (e.key === 'FlayNav.theme') {
    document.getElementsByTagName('html')[0].setAttribute('theme', e.newValue);
  }
};
