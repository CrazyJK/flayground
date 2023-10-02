import './lib/ThemeListener';
import './page.statistics.scss';

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

let rawList = [];
let startDate;
let endDate;

fetch('/flay')
  .then((res) => res.json())
  .then((list) => {
    rawList = list;
    init();
  });

function init() {
  const to2 = (n) => (n < 10 ? '0' + n : n);
  const startDate = document.querySelector('#startDate');
  const endDate = document.querySelector('#endDate');

  // set initial value
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  startDate.value = `${today.getFullYear()}-01-01`;
  endDate.value = `${today.getFullYear()}-${to2(lastDayOfMonth.getMonth() + 1)}-${to2(lastDayOfMonth.getDate())}`;

  startDate.addEventListener('change', start);
  endDate.addEventListener('change', start);

  start();
}

function start() {
  startDate = document.querySelector('#startDate').value.replace(/-/g, '.');
  endDate = document.querySelector('#endDate').value.replace(/-/g, '.');

  const filteredList = [];
  rawList.forEach((flay) => {
    if (startDate && endDate) {
      if (startDate < flay.release && flay.release < endDate) {
        filteredList.push(flay);
      }
    } else {
      filteredList.push(flay);
    }
  });

  document.querySelector('#info').innerHTML = filteredList.length + ' Flay';

  analyzeStudio(filteredList);
  analyzeActress(filteredList);
}

function analyzeStudio(flayList) {
  const rawMap = new Map();
  Array.from(flayList).forEach((flay) => {
    fillMap(rawMap, flay.studio, flay);
  });
  calculateRank(rawMap);
  renderTable('#studio', rawMap);
  console.log('studio rank map', rawMap);
}

function analyzeActress(flayList) {
  const rawMap = new Map();
  Array.from(flayList).forEach((flay) => {
    Array.from(flay.actressList).forEach((actress) => {
      fillMap(rawMap, actress, flay);
    });
  });
  calculateRank(rawMap);
  renderTable('#actress', rawMap);

  console.log('actress raw map', rawMap);
}

function fillMap(rawMap, key, flay) {
  const value = rawMap.get(key);
  if (!value) {
    const list = [flay];
    rawMap.set(key, {
      list: list,
      rank: {
        avg: 0,
        sum: 0,
      },
    });
  } else {
    value.list.push(flay);
  }
}

function calculateRank(rawMap) {
  rawMap.forEach((value, key, map) => {
    // sum
    let sum = 0;
    value.list.forEach((flay) => {
      sum += flay.video.rank;
    });
    // avg
    let avg = sum / value.list.length;
    // set
    value.rank.sum = sum;
    value.rank.avg = avg;
  });
}

function renderTable(selector, rawMap) {
  const wrap = document.querySelector(selector);
  if (!wrap) {
    return;
  }
  document.querySelectorAll(`${selector} li:not(.head)`).forEach((li) => li.remove());

  // sort
  const mapToArray = [...rawMap];
  mapToArray.sort((a, b) => {
    return b[1].rank.sum - a[1].rank.sum;
  });

  mapToArray.forEach((element) => {
    const key = element[0];
    const value = element[1];

    const item = wrap.appendChild(document.createElement('li'));
    const name = item.appendChild(document.createElement('label'));
    name.classList.add('name');
    const link = name.appendChild(document.createElement('a'));
    link.innerHTML = key;
    link.addEventListener('click', () => {
      if (selector === '#studio') {
        window.open('card.studio.html?name=' + key + '&s=' + startDate + '&e=' + endDate, key, 'width=960px,height=1200px');
      } else {
        window.open('card.actress.html?name=' + key + '&s=' + startDate + '&e=' + endDate, key, 'width=960px,height=1200px');
      }
    });
    const sum = item.appendChild(document.createElement('label'));
    sum.classList.add('sum');
    sum.innerHTML = value.rank.sum;
    const size = item.appendChild(document.createElement('label'));
    size.classList.add('size');
    size.innerHTML = value.list.length;
    const avg = item.appendChild(document.createElement('label'));
    avg.classList.add('avg');
    avg.innerHTML = value.rank.avg.toFixed(2);
  });
}
