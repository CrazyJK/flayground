import SVG from '../resources/svg/svg.json';
import './card.actress.scss';
import FlayCard from './flay/FlayCard';
import Search from './util/Search';
import flayAction from './util/flay.action';
import './util/flay.sse';
import './util/theme.listener';
import { addResizeLazyEventListener } from './util/windowResize';

window.tagList = [];

const urlParams = new URL(location.href).searchParams;
const actressName = urlParams.get('name');
const startDate = urlParams.get('s');
const endDate = urlParams.get('e');

const flayMap = new Map();

const favorite = document.querySelector('#favorite');
const favLabel = document.querySelector('#favorite + label');
const name = document.querySelector('#name');
const localName = document.querySelector('#localName');
const flayRank = document.querySelector('#flayRank');
const birth = document.querySelector('#birth');
const age = document.querySelector('#age');
const body = document.querySelector('#body');
const height = document.querySelector('#height');
const debut = document.querySelector('#debut');
const comment = document.querySelector('#comment');
const saveBtn = document.querySelector('#saveBtn');
const findBtn = document.querySelector('#findBtn');
const searchBtn = document.querySelector('#searchBtn');

favLabel.innerHTML = SVG.favorite;
document.title = actressName;

function fetchActress() {
  fetch('/info/actress/' + actressName)
    .then((res) => res.json())
    .then((actress) => {
      console.log(actress);
      favorite.checked = actress.favorite;
      name.value = actress.name;
      localName.value = actress.localName;
      birth.value = actress.birth;
      age.innerHTML = calcAge(actress.birth) + '<small>y</small>';
      body.value = actress.body;
      height.value = actress.height;
      debut.value = actress.debut;
      comment.value = actress.comment;
    });

  fetch('/flay/find/actress/' + actressName)
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

fetchActress();

flayRank.addEventListener('change', (e) => {
  console.log('rank change', e.target.value);
  toggleByRank(e.target.value);
});

saveBtn.addEventListener('click', () => {
  flayAction.updateActress({
    favorite: favorite.checked,
    name: name.value.trim(),
    localName: localName.value.trim(),
    debut: debut.value.trim(),
    birth: birth.value.trim(),
    body: body.value.trim(),
    height: height.value.trim(),
    comment: comment.value.trim(),
  });
});

findBtn.addEventListener('click', (e) => Search.actress.Minnano(localName.value));

searchBtn.addEventListener('click', (e) => Search.actress.Nextjav(name.value));

addResizeLazyEventListener(() => {
  flayMap.forEach((flayCard) => {
    flayCard.resize();
  });
});

function calcAge(birth) {
  if (birth === null || birth.trim().length === 0) {
    return '';
  }
  let birthYear = parseInt(birth.substring(0, 4));
  let todayYear = new Date().getFullYear();
  return todayYear - birthYear + 1;
}

async function renderFlayCardList(opusList) {
  document.querySelector('article').textContent = null;
  flayMap.clear();
  for (let opus of opusList) {
    let flayCard = new FlayCard({ excludes: ['FlayActress'] });
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
  if (actressName === actress.name) fetchActress();
};
window.emitTag = (tag) => {
  fetchActress();
};
