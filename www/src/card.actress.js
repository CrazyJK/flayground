import './card.actress.scss';
import FlayCard from './elements/card/FlayCard';
import SVG from './elements/svg.json';
import flayAction from './util/flay.action';
import './util/flay.sse';
import './util/theme.listener';

const urlParams = new URL(location.href).searchParams;
const actressName = urlParams.get('name');
const flayMap = new Map();
const condition = {
  search: actressName,
  withSubtitles: false,
  withFavorite: false,
  withNoFavorite: false,
  rank: [0, 1, 2, 3, 4, 5],
  sort: 'RELEASE',
  reverse: true,
};

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

  fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(condition) })
    .then((res) => res.json())
    .then((list) => {
      console.log(list);
      renderFlayCardList(list).then(() => {
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
  if (actressName === actress.name) fetchActress();
};
window.emitTag = (tag) => {
  fetchActress();
};
