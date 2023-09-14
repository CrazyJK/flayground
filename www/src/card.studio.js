import './card.studio.scss';
import FlayCard from './elements/card/FlayCard';
import flayAction from './util/flay.action';
import './util/flay.sse';
import './util/theme.listener';
import { addResizeLazyEventListener } from './util/windowResize';

const urlParams = new URL(location.href).searchParams;
const name = urlParams.get('name');
const startDate = urlParams.get('s');
const endDate = urlParams.get('e');

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
      const opusList = Array.from(list)
        .filter((flay) => {
          if (startDate && endDate) {
            return startDate < flay.release && flay.release < endDate;
          } else {
            return true;
          }
        })
        .map((flay) => flay.opus);
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

addResizeLazyEventListener(() => {
  flayMap.forEach((flayCard) => {
    flayCard.resize();
  });
});

async function renderFlayCardList(opusList) {
  document.querySelector('article').textContent = null;
  flayMap.clear();
  for (let opus of opusList) {
    let flayCard = new FlayCard({ excludes: ['FlayStudio', 'FlayTag'] });
    flayMap.set(opus, flayCard);
    document.querySelector('article').appendChild(flayCard);
    await flayCard.set(opus).then(() => {
      return new Promise((resolve) => setTimeout(resolve, 100));
    });
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
    sumRank += rank;
    totalFlay++;
  });
  flaySizeByRank.forEach((flaySize, r) => {
    document.querySelector(`#flayRank option[value="${r}"]`).innerHTML = `Rank ${r} : ${flaySize}`;
  });
  document.querySelector(`#flayRank option:first-child`).innerHTML = `Rank ${(sumRank / totalFlay).toFixed(1)} : ${totalFlay} F`;
}

window.emitFlay = (flay) => {
  let flayCard = flayMap.get(flay.opus);
  if (flayCard) flayCard.reload();
  countFlaySizeByRank();
};
window.emitStudio = (studio) => {
  if (name === studio.name) fetchStudio();
};
window.emitVideo = (video) => {
  let flayCard = flayMap.get(video.opus);
  if (flayCard) flayCard.reload();
  countFlaySizeByRank();
};
window.emitActress = (actress) => {
  fetchStudio();
};
