import FlayCard from './components/FlayCard';
import SVG from './components/svg.json';
import './flay.actress.scss';
import flayAction from './util/flay.action';

const urlParams = new URL(location.href).searchParams;
const actressName = urlParams.get('name');

document.title = actressName;

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
const birth = document.querySelector('#birth');
const age = document.querySelector('#age');
const body = document.querySelector('#body');
const height = document.querySelector('#height');
const debut = document.querySelector('#debut');
const comment = document.querySelector('#comment');
const saveBtn = document.querySelector('#saveBtn');

favLabel.innerHTML = SVG.favorite;

fetch('/info/actress/' + actressName)
  .then((res) => res.json())
  .then((actress) => {
    console.log(actress);
    favorite.checked = actress.favorite;
    name.value = actress.name;
    localName.value = actress.localName;
    birth.value = actress.birth;
    age.innerHTML = calcAge(actress.birth);
    body.value = actress.body;
    height.value = actress.height;
    debut.value = actress.debut;
    comment.value = actress.comment;
  });

fetch('/flay/list/opus', { method: 'post', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(condition) })
  .then((res) => res.json())
  .then((list) => {
    console.log(list);
    Array.from(list).forEach((opus) => {
      let flayCard = new FlayCard();
      flayCard.set(opus);
      document.querySelector('article').appendChild(flayCard);
    });
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
