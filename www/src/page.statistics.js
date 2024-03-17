import './init/Page';
import './page.statistics.scss';

import './lib/TabUI';
import { sortable } from './lib/TableUtils';
import { getPrettyFilesize } from './util/fileUtils';

const to2 = (n) => (n < 10 ? '0' + n : n);
const startDateInput = document.querySelector('#startDate');
const endDateInput = document.querySelector('#endDate');

startDateInput.addEventListener('change', start);
endDateInput.addEventListener('change', start);

let rawList = [];
let filteredList = [];
let startDate;
let endDate;

Promise.all([fetch('/flay').then((res) => res.json()), fetch('/archive').then((res) => res.json())]).then(([flayList, archiveList]) => {
  rawList.push(...flayList);
  archiveList.forEach((a) => {
    if (flayList.filter((f) => f.opus === a.opus).length === 0) {
      rawList.push(a);
    }
  });
  rawList = Array.from(rawList).sort((f1, f2) => f1.release.localeCompare(f2.release));

  start();
});

setInitialValue();

function setInitialValue() {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  startDateInput.value = `${today.getFullYear() - 1}-${to2(lastDayOfMonth.getMonth() + 1)}-01`;
  endDateInput.value = `${today.getFullYear()}-${to2(lastDayOfMonth.getMonth() + 1)}-${to2(lastDayOfMonth.getDate())}`;
}

function start() {
  startDate = document.querySelector('#startDate').value.replace(/-/g, '.');
  endDate = document.querySelector('#endDate').value.replace(/-/g, '.');

  filteredList = [];
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

  startStudioActress();
  startRankGroup();
  startTimeline();
  startActressAge();
}

function startStudioActress() {
  function analyzeStudio() {
    const rawMap = new Map();
    Array.from(filteredList).forEach((flay) => {
      fillMap(rawMap, flay.studio, flay);
    });
    calculateRank(rawMap);
    renderTable('#studio', rawMap);
    console.debug('studio rank map', rawMap);
  }

  function analyzeActress() {
    const rawMap = new Map();
    Array.from(filteredList).forEach((flay) => {
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
        shotLength: 0,
      });
    } else {
      value.list.push(flay);
    }
  }

  function calculateRank(rawMap) {
    rawMap.forEach((value, key, map) => {
      // sum
      let sum = 0;
      let shotLength = 0;
      value.list.forEach((flay) => {
        sum += flay.video.rank;
        if (flay.video.likes?.length > 0) {
          ++shotLength;
        }
      });
      // avg
      let avg = sum / value.list.length;
      // set
      value.rank.sum = sum;
      value.rank.avg = avg;
      value.shotLength = shotLength;
    });
  }

  function renderTable(selector, rawMap) {
    const wrap = document.querySelector(selector);
    if (!wrap) {
      return;
    }
    document.querySelectorAll(`${selector} li:not(.thead)`).forEach((li) => li.remove());

    // sort
    const mapToArray = [...rawMap];
    mapToArray.sort((a, b) => {
      const avgCompage = b[1].rank.avg - a[1].rank.avg;
      const sumCompate = b[1].rank.sum - a[1].rank.sum;
      return avgCompage === 0 ? sumCompate : avgCompage;
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
          window.open('popup.studio.html?name=' + key + '&s=' + startDate + '&e=' + endDate, key, 'width=960px,height=1200px');
        } else {
          window.open('popup.actress.html?name=' + key + '&s=' + startDate + '&e=' + endDate, key, 'width=960px,height=1200px');
        }
      });

      // const sum = item.appendChild(document.createElement('label'));
      // sum.classList.add('sum');
      // sum.innerHTML = value.rank.sum;

      const size = item.appendChild(document.createElement('label'));
      size.classList.add('size');
      size.innerHTML = value.list.length;

      const shot = item.appendChild(document.createElement('label'));
      shot.classList.add('shot');
      shot.innerHTML = value.shotLength;

      const avg = item.appendChild(document.createElement('label'));
      avg.classList.add('avg');
      avg.innerHTML = value.rank.avg.toFixed(2);
    });
    sortable(wrap);
  }

  analyzeStudio();
  analyzeActress();
}

function startRankGroup() {
  const rankMap = new Map();
  Array.from({ length: 7 }, (v, i) => i).forEach((r) => rankMap.set(r - 1, []));

  Array.from(filteredList).forEach((flay) => rankMap.get(flay.video.rank).push(flay));

  rankMap.forEach((flayList, key) => {
    const rankList = document.querySelector(`#rank${key} .list`);
    const countLabel = document.querySelector(`#rank${key} .count`);
    const lengthLabel = document.querySelector(`#rank${key} .length`);

    rankList.textContent = null;

    let count = 0;
    let length = 0;
    flayList.forEach((flay) => {
      count++;
      length += flay.length;

      const flayLabel = rankList.appendChild(document.createElement('label'));
      flayLabel.title = flay.opus;
      flayLabel.classList.add('flay');
      flayLabel.classList.toggle('archive', flay.archive);
      flayLabel.classList.toggle('shot', flay.video.likes?.length > 0);
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
  const firstDate = new Date(filteredList[0].release);
  const lastDate = new Date(filteredList[filteredList.length - 1].release);
  console.debug('date', firstDate, lastDate);

  const dates = [];
  while (firstDate <= lastDate) {
    dates.push(firstDate.toISOString().substring(0, 7).replace('-', '.'));
    firstDate.setMonth(firstDate.getMonth() + 1);
  }
  console.debug('dates', dates);

  const timelineMap = new Map();
  dates.sort((d1, d2) => d2.localeCompare(d1)).forEach((d) => timelineMap.set(d, []));
  filteredList.forEach((flay) => timelineMap.get(flay.release.substring(0, 7)).push(flay));
  console.debug(timelineMap);

  const wrapper = document.querySelector('.timeline-grid');
  wrapper.querySelectorAll('div:not(.grid-head)').forEach((div) => div.remove());

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

/**
 * 발매일자의 배우 나이별 순위
 */
async function startActressAge() {
  const actressMap = new Map();
  const ageFlayMap = new Map();
  //
  async function getActressInfo(name) {
    if (!actressMap.has(name)) {
      const actress = await fetch(`/info/actress/${name}`).then((res) => res.json());
      actressMap.set(name, actress);
    }
    return actressMap.get(name);
  }

  for (const flay of filteredList) {
    if (flay.archive) {
      continue;
    }
    const releaseYear = flay.release.substring(0, 4);
    for (const actressName of flay.actressList) {
      const actress = await getActressInfo(actressName);
      const actressBirthYear = actress.birth?.substring(0, 4);
      let actressAgeAtRelease = parseInt(releaseYear) - parseInt(actressBirthYear) + 1;
      if (isNaN(actressAgeAtRelease)) {
        actressAgeAtRelease = 99;
      }
      if (!ageFlayMap.has(actressAgeAtRelease)) {
        ageFlayMap.set(actressAgeAtRelease, []);
      }
      ageFlayMap.get(actressAgeAtRelease).push(flay);
    }
  }

  const wrapper = document.querySelector('.actressAge-grid');
  wrapper.querySelectorAll('div:not(.grid-head)').forEach((div) => div.remove());

  const sortedAgeFlayMap = new Map(Array.from(ageFlayMap).sort((a, b) => a[0] - b[0]));

  sortedAgeFlayMap.forEach((flayList, key) => {
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

const getFlayLabel = (flayList) => {
  const labels = [];
  flayList.forEach((flay) => {
    const flayLabel = document.createElement('label');
    flayLabel.title = flay.opus;
    flayLabel.classList.add('flay');
    flayLabel.classList.toggle('archive', flay.archive);
    flayLabel.classList.toggle('shot', flay.video.likes?.length > 0);
    flayLabel.addEventListener('click', () => {
      flayLabel.classList.add('active');
      window.open('popup.flay.html?opus=' + flay.opus, 'popup.' + flay.opus, 'width=800px,height=1280px');
    });
    labels.push(flayLabel);
  });
  return labels;
};
