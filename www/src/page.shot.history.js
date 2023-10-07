import FlayCard from './flay/FlayCard';
import './lib/ThemeListener';
import './page.shot.history.scss';
import { appendStyle } from './util/componentCssLoader';

appendStyle();

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

let i = 0;

showHistory();

const MAIN = document.querySelector('body > main');

document.getElementById('next').addEventListener('click', showHistory);

async function showHistory() {
  let end = i + 10;
  for (; i < end; i++) {
    let date = getDate(i);
    fetch('/info/history/find/' + date)
      .then((res) => res.json())
      .then((list) => Array.from(list).filter((h) => h.action === 'PLAY')) // PLAY
      .then((list) => {
        let opusList = [];
        return list.filter((h) => {
          if (opusList.indexOf(h.opus) === -1) {
            opusList.push(h.opus);
            return true;
          }
          return false;
        });
      }) // 중복 제거
      .then((list) => render(date, list));

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

function getDate(priorDay) {
  const date = new Date(new Date().setDate(new Date().getDate() - priorDay));
  return date.toISOString().substring(0, 10);
}

async function render(date, list) {
  console.debug('render', date, list);
  let div = MAIN.appendChild(document.createElement('fieldset'));
  let label = div.appendChild(document.createElement('legend'));
  label.textContent = date + ' ' + new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(new Date(date));
  let cardDiv = div.appendChild(document.createElement('div'));
  for (let h of list) {
    console.debug('history', h.opus, h);
    let flayCard = cardDiv.appendChild(new FlayCard({ excludes: ['FlayTag', 'FlayComment', 'FlayFiles'] }));

    fetch('/flay/' + h.opus + '/fully')
      .then((res) => {
        if (res.status === 404) {
          flayCard.notfound(h.opus);
        }
        return res.json();
      })
      .then((fullyFlay) => {
        console.debug('flay likes', h.opus, fullyFlay.flay.video.likes);
        let likes = fullyFlay.flay.video.likes;
        if (likes && likes.length > 0) {
          if (Array.from(likes).filter((l) => l.substring(0, 10) === date).length > 0) {
            console.debug('this is shot', fullyFlay.flay.opus);
            flayCard.classList.add('shot');
          }
        }
        flayCard.set(h.opus, fullyFlay);
      })
      .catch((e) => {
        console.error(e);
      });

    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}
