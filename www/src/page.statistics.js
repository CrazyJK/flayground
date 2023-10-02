import './lib/ThemeListener';
import './page.statistics.scss';
import { getPrettyFilesize } from './util/fileUtils';

import SideNavBar from './nav/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

let rawList = [];
let startDate;
let endDate;

fetch('/flay')
  .then((res) => res.json())
  .then((list) => (rawList = list))
  .then(() => {
    const to2 = (n) => (n < 10 ? '0' + n : n);
    const startDate = document.querySelector('#startDate');
    const endDate = document.querySelector('#endDate');

    // set initial value
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    startDate.value = `${today.getFullYear()}-01-01`;
    endDate.value = `${today.getFullYear()}-${to2(lastDayOfMonth.getMonth() + 1)}-${to2(lastDayOfMonth.getDate())}`;

    startDate.addEventListener('change', startStudioActress);
    endDate.addEventListener('change', startStudioActress);

    startStudioActress();
    startRankGroup();
    startTimeline();
  });

const studioActressBtn = document.querySelector('#studioActressBtn');
const rankGrounpBtn = document.querySelector('#rankGrounpBtn');
const timelineBtn = document.querySelector('#timelineBtn');

studioActressBtn.addEventListener('click', (e) => {
  document.querySelectorAll('.tab-content').forEach((element) => (element.style.display = 'none'));
  document.querySelector('#studioActress').style.display = 'block';
});
rankGrounpBtn.addEventListener('click', (e) => {
  document.querySelectorAll('.tab-content').forEach((element) => (element.style.display = 'none'));
  document.querySelector('#rankGrounp').style.display = 'block';
});
timelineBtn.addEventListener('click', (e) => {
  document.querySelectorAll('.tab-content').forEach((element) => (element.style.display = 'none'));
  document.querySelector('#timeline').style.display = 'block';
});

function startStudioActress() {
  function analyzeStudio(flayList) {
    const rawMap = new Map();
    Array.from(flayList).forEach((flay) => {
      fillMap(rawMap, flay.studio, flay);
    });
    calculateRank(rawMap);
    renderTable('#studio', rawMap);
    console.debug('studio rank map', rawMap);
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

    console.debug('actress raw map', rawMap);
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

function startRankGroup() {
  const rankMap = new Map();
  Array.from({ length: 7 }, (v, i) => i).forEach((r) => rankMap.set(r - 1, []));

  Array.from(rawList).forEach((flay) => rankMap.get(flay.video.rank).push(flay));

  rankMap.forEach((flayList, key) => {
    const rankList = document.querySelector(`#rank${key} .list`);
    const countLabel = document.querySelector(`#rank${key} .count`);
    const lengthLabel = document.querySelector(`#rank${key} .length`);

    let count = 0;
    let length = 0;
    flayList.forEach((flay) => {
      count++;
      length += flay.length;

      const flayLabel = rankList.appendChild(document.createElement('label'));
      flayLabel.title = flay.opus;
      flayLabel.innerHTML = '■';
      flayLabel.addEventListener('click', () => {
        flayLabel.classList.add('active');
        window.open('popup.flay.html?opus=' + flay.opus, 'popup.' + flay.opus, 'width=800px,height=1280px');
      });
    });
    countLabel.innerHTML = count > 0 ? count + ' Flay' : '';
    const [size, unit] = getPrettyFilesize(length);
    lengthLabel.innerHTML = length > 0 ? `${size} <small>${unit}</small>` : '';
  });
}

function startTimeline() {
  const getFlayLabel = (flayList) => {
    const labels = [];
    flayList.forEach((flay) => {
      const flayLabel = document.createElement('label');
      flayLabel.title = flay.opus;
      flayLabel.innerHTML = '■';
      flayLabel.addEventListener('click', () => {
        flayLabel.classList.add('active');
        window.open('popup.flay.html?opus=' + flay.opus, 'popup.' + flay.opus, 'width=800px,height=1280px');
      });
      labels.push(flayLabel);
    });
    return labels;
  };
  const sortedFlayList = Array.from(rawList).sort((f1, f2) => f1.release.localeCompare(f2.release));
  const firstDate = new Date(sortedFlayList[0].release);
  const lastDate = new Date(sortedFlayList[sortedFlayList.length - 1].release);
  console.debug('date', firstDate, lastDate);

  const dates = [];
  while (firstDate <= lastDate) {
    dates.push(firstDate.toISOString().substring(0, 7).replace('-', '.'));
    firstDate.setMonth(firstDate.getMonth() + 1);
  }
  console.debug('dates', dates);

  const timelineMap = new Map();
  dates.sort((d1, d2) => d2.localeCompare(d1)).forEach((d) => timelineMap.set(d, []));
  sortedFlayList.forEach((flay) => timelineMap.get(flay.release.substring(0, 7)).push(flay));
  console.debug(timelineMap);

  const wrapper = document.querySelector('.timeline-grid');
  timelineMap.forEach((flayList, key) => {
    const rankMap = new Map();
    Array.from({ length: 7 }, (v, i) => i).forEach((r) => rankMap.set(r - 1, []));
    Array.from(flayList).forEach((flay) => rankMap.get(flay.video.rank).push(flay));

    const time = wrapper.appendChild(document.createElement('div'));
    time.classList.add('grid-data', 'time');
    time.innerHTML = key;
    for (let i = -1; i <= 5; i++) {
      const rank = wrapper.appendChild(document.createElement('div'));
      rank.classList.add('grid-data', 'rank');
      let count = 0;
      let length = 0;
      rankMap.get(i).forEach((flay) => {
        count++;
        length += flay.length;
      });
      if (count > 0) {
        const [size, unit] = getPrettyFilesize(length);
        rank.title = `${count} Flay, ${size} ${unit}`;
      }
      rank.append(...getFlayLabel(rankMap.get(i)));
    }
  });
}
