import './init/Page';
import './page.statistics.scss';

import { tabUI } from './lib/TabUI';
import { sortable } from './lib/TableUtils';
import FileUtils from './util/FileUtils';
import { popupActress, popupFlay, popupStudio } from './util/FlaySearch';
import StringUtils from './util/StringUtils';

tabUI(document);

const to2 = (n) => (n < 10 ? '0' + n : n);
const startDateInput = document.querySelector('#startDate');
const endDateInput = document.querySelector('#endDate');
const withArchiveData = document.querySelector('#withArchiveData');

startDateInput.addEventListener('change', start);
endDateInput.addEventListener('change', start);
withArchiveData.addEventListener('change', start);

let instanceList = [];
let archiveList = [];
let rawList = [];
let filteredList = [];
let startDate;
let endDate;

Promise.all([fetch('/flay').then((res) => res.json()), fetch('/archive').then((res) => res.json())]).then(([instances, archives]) => {
  instanceList = instances;
  archiveList = archives;

  start();
});

setInitialValue();

function setInitialValue() {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  startDateInput.value = `${today.getFullYear() - 3}-${to2(lastDayOfMonth.getMonth() + 1)}-01`;
  endDateInput.value = `${today.getFullYear()}-${to2(lastDayOfMonth.getMonth() + 2)}-${to2(lastDayOfMonth.getDate())}`;
}

function start() {
  startDate = startDateInput.value.replace(/-/g, '.');
  endDate = endDateInput.value.replace(/-/g, '.');
  console.log('startDate', startDate, 'endDate', endDate);

  rawList = [];
  rawList.push(...instanceList);
  if (withArchiveData.checked) {
    archiveList.forEach((a) => {
      if (instanceList.filter((f) => f.opus === a.opus).length === 0) {
        rawList.push(a);
      }
    });
  }
  rawList = Array.from(rawList).sort((f1, f2) => f1.release.localeCompare(f2.release));
  console.log('rawList length', rawList.length);

  filteredList = [];
  if (StringUtils.isBlank(startDate) || StringUtils.isBlank(endDate)) {
    filteredList = rawList;
  } else {
    rawList.forEach((flay) => {
      if (startDate < flay.release && flay.release < endDate) {
        filteredList.push(flay);
      }
    });
  }
  console.log('filteredList length', filteredList.length);

  document.querySelector('#info').innerHTML = filteredList.length + ' Flay';

  startStudioActress();
  startRankGroup();
  startTimeline();
  startActressAge();
  startShotFlay();
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
          popupStudio(key, startDate, endDate);
        } else {
          popupActress(key, startDate, endDate);
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
    sortable(wrap, { initSortIndex: 2 });
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
        popupFlay(flay.opus);
      });
    });
    countLabel.innerHTML = count > 0 ? count + ' Flay' : '';
    const [size, unit] = FileUtils.prettySize(length);
    lengthLabel.innerHTML = length > 0 ? `${size} <small>${unit}</small>` : '';
  });
}

function startTimeline() {
  const firstDate = new Date(filteredList[0].release);
  const lastDate = new Date(filteredList[filteredList.length - 1].release);
  lastDate.setMonth(lastDate.getMonth() + 1);
  lastDate.setDate(1);
  console.log('date', firstDate.toISOString(), lastDate.toISOString());

  const dates = [];
  while (firstDate <= lastDate) {
    dates.push(firstDate.toISOString().substring(0, 7).replace('-', '.'));
    firstDate.setMonth(firstDate.getMonth() + 1);
  }
  // console.log('dates', dates);

  const timelineMap = new Map();
  dates.sort((d1, d2) => d2.localeCompare(d1)).forEach((d) => timelineMap.set(d, []));
  filteredList.forEach((flay) => {
    const key = flay.release.substring(0, 7);
    if (StringUtils.isBlank(key)) {
      console.warn('release is empty');
    }
    if (!timelineMap.has(key)) {
      console.warn('timelineMap key notfound', key);
      timelineMap.set(key, []);
    }
    timelineMap.get(key).push(flay);
  });
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
    let flayCount = 0;
    let shotCount = 0;
    for (let i = -1; i <= 5; i++) {
      const rank = wrapper.appendChild(document.createElement('div'));
      rank.classList.add('grid-data', 'rank');
      let count = 0;
      let shot = 0;
      let length = 0;
      rankMap.get(i).forEach((flay) => {
        count++;
        if (flay.video.likes?.length > 0) {
          shot++;
        }
        length += flay.length;
      });
      if (count > 0) {
        const [size, unit] = FileUtils.prettySize(length);
        rank.title = `${count} Flay, ${size} ${unit}`;
      }
      rank.append(...getFlayLabel(rankMap.get(i)));
      flayCount += count;
      shotCount += shot;
    }
    time.innerHTML += `${String.fromCharCode(160)}<small>(${shotCount}/${flayCount})</small>`;
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
    // if (flay.archive) {
    //   continue;
    // }
    const releaseYear = flay.release.substring(0, 4);
    for (const actressName of flay.actressList) {
      const actress = await getActressInfo(actressName);
      const actressBirthYear = actress.birth?.substring(0, 4);
      let actressAgeAtRelease = parseInt(releaseYear) - parseInt(actressBirthYear) + 1;
      if (isNaN(actressAgeAtRelease)) {
        actressAgeAtRelease = 0;
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
    let flayCount = 0;
    let shotCount = 0;
    for (let i = -1; i <= 5; i++) {
      const rank = wrapper.appendChild(document.createElement('div'));
      rank.classList.add('grid-data', 'rank');
      let count = 0;
      let shot = 0;
      let length = 0;
      rankMap.get(i).forEach((flay) => {
        count++;
        if (flay.video.likes?.length > 0) {
          shot++;
        }
        length += flay.length;
      });
      if (count > 0) {
        const [size, unit] = FileUtils.prettySize(length);
        rank.title = `${count} Flay, ${size} ${unit}`;
      }
      rank.append(...getFlayLabel(rankMap.get(i)));
      flayCount += count;
      shotCount += shot;
    }
    time.innerHTML += `${String.fromCharCode(160)}<small>(${shotCount}/${flayCount})</small>`;
  });
}

async function startShotFlay() {
  const studioMap = new Map();
  const actressMap = new Map();
  const releaseMap = new Map();
  const shotFlayList = [];
  for (const flay of filteredList) {
    if (flay.archive) {
      continue;
    }
    if (flay.video.likes?.length > 0) {
      shotFlayList.push(flay);

      if (!studioMap.has(flay.studio)) studioMap.set(flay.studio, { shotLength: 0, shotSum: 0 });
      const studioValue = studioMap.get(flay.studio);
      studioValue.shotLength += 1;
      studioValue.shotSum += flay.video.likes.length;

      flay.actressList.forEach((name) => {
        if (!actressMap.has(name)) actressMap.set(name, { shotLength: 0, shotSum: 0 });
        const actressValue = actressMap.get(name);
        actressValue.shotLength += 1;
        actressValue.shotSum += flay.video.likes.length;
      });

      var releaseKey = flay.release.substring(0, 4);
      if (!releaseMap.has(releaseKey)) releaseMap.set(releaseKey, { shotLength: 0, shotSum: 0 });
      const releaseValue = releaseMap.get(releaseKey);
      releaseValue.shotLength += 1;
      releaseValue.shotSum += flay.video.likes.length;
    }
  }
  shotFlayList.sort((a, b) => b.video.likes.length - a.video.likes.length);
  console.log('shot flay list', shotFlayList);

  const wrapper = document.querySelector('.shot-flay-list');
  wrapper.textContent = null;

  shotFlayList.forEach((flay) => {
    const item = wrapper.appendChild(document.createElement('li'));
    item.dataset.filter = `${flay.studio} ${flay.actressList.join(' ')} ${flay.release.substring(0, 4)}`;
    item.innerHTML = `
      <div style="background-image: url(/static/cover/${flay.opus})">
        <label class="title"><span>${flay.title}</span></label>
        <label class="actress"><span>${flay.actressList.join(', ')}</span></label>
        <label class="shot"><span>${flay.video.likes.length}</span></label>
        <label class="studio"><span>${flay.studio}</span></label>
        <label class="opus"><span>${flay.opus}</span></label>
        <label class="release"><span>${flay.release}</span></label>
      </div>
    `;
    item.querySelector('.title').addEventListener('click', () => popupFlay(flay.opus));
  });
  document.querySelector('#shotFlayCount').innerHTML = shotFlayList.length;
  console.log(studioMap, actressMap, releaseMap);

  document.querySelector('.statistics-studio').textContent = null;
  Array.from(studioMap)
    .sort((a, b) => b[1].shotLength - a[1].shotLength)
    .forEach(([key, value], i) => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'studio';
      input.id = 'studio' + i;
      input.value = key;

      const label = document.createElement('label');
      label.setAttribute('for', 'studio' + i);
      label.innerHTML = `<span>${key}</span> <span>${value.shotSum}</span> <span>${value.shotLength}</span>`;

      document.querySelector('.statistics-studio').append(input, label);
    });

  document.querySelector('.statistics-actress').textContent = null;
  Array.from(actressMap)
    .sort((a, b) => b[1].shotLength - a[1].shotLength)
    .forEach(([key, value], i) => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'actress';
      input.id = 'actress' + i;
      input.value = key;

      const label = document.createElement('label');
      label.setAttribute('for', 'actress' + i);
      label.innerHTML = `<span>${key}</span> <span>${value.shotSum}</span> <span>${value.shotLength}</span>`;

      document.querySelector('.statistics-actress').append(input, label);
    });

  document.querySelector('.statistics-release').textContent = null;
  releaseMap.forEach((value, key) => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'release';
    input.id = 'release' + key;
    input.value = key;

    const label = document.createElement('label');
    label.setAttribute('for', 'release' + key);
    label.innerHTML = `<span>${key}</span> <span>${value.shotSum}</span> <span>${value.shotLength}</span>`;

    document.querySelector('.statistics-release').append(input, label);
  });

  document.querySelectorAll('.statistics input').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      console.log('checkbox change', e.target.checked, e.target.value, document.querySelectorAll('.statistics input:checked').length);
      if (document.querySelectorAll('.statistics input:checked').length === 0) {
        wrapper.querySelectorAll('li').forEach((li) => li.classList.remove('hide'));
        document.querySelectorAll('.statistics input').forEach((input) => (input.disabled = false));
      } else {
        const checkedFilterWords = Array.from(document.querySelectorAll('.statistics input:checked')).map((checkbox) => checkbox.value);
        wrapper.querySelectorAll('li').forEach((li) => {
          let found = true;
          checkedFilterWords.forEach((word) => {
            found = found && li.dataset.filter.includes(word);
          });
          li.classList.toggle('hide', !found);
        });

        const filteredStudio = new Set();
        const filteredActress = new Set();
        const filteredRelease = new Set();
        wrapper.querySelectorAll('li:not(.hide)').forEach((li) => {
          filteredStudio.add(li.querySelector('.studio').textContent);
          li.querySelector('.actress')
            .textContent.split(', ')
            .forEach((name) => filteredActress.add(name));
          filteredRelease.add(li.querySelector('.release').textContent.substring(0, 4));
        });
        console.log(filteredStudio, filteredActress, filteredRelease);

        document.querySelectorAll('.statistics-studio input').forEach((input) => {
          input.disabled = !filteredStudio.has(input.value);
        });
        document.querySelectorAll('.statistics-actress input').forEach((input) => {
          input.disabled = !filteredActress.has(input.value);
        });
        document.querySelectorAll('.statistics-release input').forEach((input) => {
          input.disabled = !filteredRelease.has(input.value);
        });
      }

      document.querySelector('#shotFlayCount').innerHTML = wrapper.querySelectorAll('li:not(.hide)').length;
    });
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
      popupFlay(flay.opus);
    });
    labels.push(flayLabel);
  });
  return labels;
};
