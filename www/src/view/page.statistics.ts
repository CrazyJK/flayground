import FlayMarker from '@flay/domain/FlayMarker';
import VideoDatePanel from '@flay/panel/VideoDatePanel';
import { createHistogramChart } from '@lib/ChartUtils';
import FileUtils from '@lib/FileUtils';
import FlayFetch, { Actress, Flay } from '@lib/FlayFetch';
import { popupActress, popupFlay, popupStudio } from '@lib/FlaySearch';
import StringUtils from '@lib/StringUtils';
import { tabUI } from '@lib/TabUI';
import { sortable } from '@lib/TableUtils';
import './inc/Page';
import './page.statistics.scss';

interface RowMapValue {
  list: Flay[];
  rank: {
    avg: number;
    sum: number;
  };
  shotLength: number;
}

tabUI(document.body);

// const to2 = (n) => (n < 10 ? '0' + n : n);
const startDateInput = document.querySelector('#startDate') as HTMLInputElement;
const endDateInput = document.querySelector('#endDate') as HTMLInputElement;
const withArchiveData = document.querySelector('#withArchiveData') as HTMLInputElement;

startDateInput.addEventListener('change', start);
endDateInput.addEventListener('change', start);
withArchiveData.addEventListener('change', start);

let instanceList: Flay[] = [];
let archiveList: Flay[] = [];
let rawList: Flay[] = [];
let filteredList: Flay[] = [];
let startDate: string;
let endDate: string;

void Promise.all([FlayFetch.getFlayAll(), FlayFetch.getArchiveAll()]).then(([instances, archives]) => {
  instanceList = instances;
  archiveList = archives;

  start();
});

// setInitialValue();

// function setInitialValue() {
//   const today = new Date();
//   const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//   startDateInput.value = `${today.getFullYear() - 3}-${to2(lastDayOfMonth.getMonth() + 1)}-01`;
//   endDateInput.value = `${today.getFullYear()}-${to2(lastDayOfMonth.getMonth() + 2)}-${to2(lastDayOfMonth.getDate())}`;
// }

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
    rawList.forEach((flay: Flay) => {
      if (startDate < flay.release && flay.release < endDate) {
        filteredList.push(flay);
      }
    });
  }
  console.log('filteredList length', filteredList.length);

  document.querySelector('#info')!.innerHTML = filteredList.length + ' Flay';

  startStudioActress();
  startRankGroup();
  startTimeline();
  startLastDate();
  void startActressAge();
  void startShotFlay();
  startChart();
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
    Array.from(filteredList).forEach((flay: Flay) => {
      Array.from(flay.actressList).forEach((actress) => {
        fillMap(rawMap, actress, flay);
      });
    });
    calculateRank(rawMap);
    renderTable('#actress', rawMap);

    console.debug('actress raw map', rawMap);
  }

  function fillMap(rawMap: Map<string, RowMapValue>, key: string, flay: Flay) {
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

  function calculateRank(rawMap: Map<string, RowMapValue>) {
    rawMap.forEach((value) => {
      // sum
      let sum = 0;
      let shotLength = 0;
      value.list.forEach((flay: Flay) => {
        sum += flay.video.rank;
        if (flay.video.likes?.length > 0) {
          ++shotLength;
        }
      });
      // avg
      const avg = sum / value.list.length;
      // set
      value.rank.sum = sum;
      value.rank.avg = avg;
      value.shotLength = shotLength;
    });
  }

  function renderTable(selector: string, rawMap: Map<string, RowMapValue>) {
    const wrap = document.querySelector(selector) as HTMLElement;
    if (!wrap) {
      return;
    }
    document.querySelectorAll(`${selector} li:not(.thead)`).forEach((li) => li.remove());

    // sort
    const mapToArray = [...rawMap];
    mapToArray.sort((a, b) => {
      const avgCompare = b[1].rank.avg - a[1].rank.avg;
      const sumCompare = b[1].rank.sum - a[1].rank.sum;
      return avgCompare === 0 ? sumCompare : avgCompare;
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
      size.innerHTML = String(value.list.length);

      const shot = item.appendChild(document.createElement('label'));
      shot.classList.add('shot');
      shot.innerHTML = String(value.shotLength);

      const avg = item.appendChild(document.createElement('label'));
      avg.classList.add('avg');
      avg.innerHTML = String(value.rank.avg.toFixed(2));
    });
    sortable(wrap, { initSortIndex: 2 });
  }

  analyzeStudio();
  analyzeActress();
}

function startRankGroup() {
  const rankMap: Map<number, Flay[]> = new Map();
  Array.from({ length: 7 }, (_, i) => i).forEach((r) => rankMap.set(r - 1, []));

  Array.from(filteredList).forEach((flay) => rankMap.get(flay.video.rank)!.push(flay));

  rankMap.forEach((flayList, key) => {
    const rankList = document.querySelector(`#rank${key} .list`) as HTMLElement;
    const countLabel = document.querySelector(`#rank${key} .count`) as HTMLElement;
    const lengthLabel = document.querySelector(`#rank${key} .length`) as HTMLElement;

    rankList.textContent = null;

    let count = 0;
    let length = 0;
    flayList.forEach((flay) => {
      count++;
      length += flay.length;

      rankList.appendChild(new FlayMarker(flay));
    });
    countLabel.innerHTML = count > 0 ? count + ' Flay' : '';
    const [size, unit] = FileUtils.prettySize(length);
    lengthLabel.innerHTML = length > 0 ? `${size} <small>${unit}</small>` : '';
  });
}

function startTimeline() {
  const firstDate = new Date(filteredList[0]!.release);
  const lastDate = new Date(filteredList[filteredList.length - 1]!.release);
  lastDate.setMonth(lastDate.getMonth() + 1);
  lastDate.setDate(1);
  console.log('date', firstDate.toISOString(), lastDate.toISOString());

  const dates = [];
  while (firstDate <= lastDate) {
    dates.push(firstDate.toISOString().substring(0, 7).replace('-', '.'));
    firstDate.setMonth(firstDate.getMonth() + 1);
  }
  // console.log('dates', dates);

  const timelineMap: Map<string, Flay[]> = new Map();
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
    timelineMap.get(key)!.push(flay);
  });
  console.debug(timelineMap);

  const wrapper = document.querySelector('.timeline-grid')!;
  wrapper.querySelectorAll('div:not(.grid-head)').forEach((div) => div.remove());

  timelineMap.forEach((flayList, key) => {
    const rankMap: Map<number, Flay[]> = new Map();
    Array.from({ length: 7 }, (_, i) => i).forEach((r) => rankMap.set(r - 1, []));
    Array.from(flayList).forEach((flay: Flay) => rankMap.get(flay.video.rank)!.push(flay));

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
      rankMap.get(i)!.forEach((flay) => {
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
      rank.append(...rankMap.get(i)!.map((flay) => new FlayMarker(flay)));
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

  async function getActressInfo(name: string): Promise<Actress> {
    if (!actressMap.has(name)) {
      const actress = await FlayFetch.getActress(name);
      actressMap.set(name, actress);
    }
    return actressMap.get(name);
  }

  for (const flay of filteredList) {
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

  const wrapper = document.querySelector('.actressAge-grid')!;
  wrapper.querySelectorAll('div:not(.grid-head)').forEach((div) => div.remove());

  const sortedAgeFlayMap: Map<number, Flay[]> = new Map(Array.from(ageFlayMap).sort((a, b) => a[0] - b[0]));

  sortedAgeFlayMap.forEach((flayList, key) => {
    const rankMap: Map<number, Flay[]> = new Map();
    Array.from({ length: 7 }, (_, i) => i).forEach((r) => rankMap.set(r - 1, []));
    Array.from(flayList).forEach((flay: Flay) => rankMap.get(flay.video.rank)!.push(flay));

    const time = wrapper.appendChild(document.createElement('div'));
    time.classList.add('grid-data', 'time');
    time.innerHTML = String(key);
    let flayCount = 0;
    let shotCount = 0;
    for (let i = -1; i <= 5; i++) {
      const rank = wrapper.appendChild(document.createElement('div'));
      rank.classList.add('grid-data', 'rank');
      let count = 0;
      let shot = 0;
      let length = 0;
      rankMap.get(i)!.forEach((flay) => {
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

      rank.append(...rankMap.get(i)!.map((flay) => new FlayMarker(flay)));
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

      const releaseKey = flay.release.substring(0, 4);
      if (!releaseMap.has(releaseKey)) releaseMap.set(releaseKey, { shotLength: 0, shotSum: 0 });
      const releaseValue = releaseMap.get(releaseKey);
      releaseValue.shotLength += 1;
      releaseValue.shotSum += flay.video.likes.length;
    }
  }
  shotFlayList.sort((a, b) => b.video.likes.length - a.video.likes.length);
  console.log('shot flay list', shotFlayList);

  const wrapper = document.querySelector('.shot-flay-list')!;
  wrapper.textContent = null;

  for (const flay of shotFlayList) {
    const item = wrapper.appendChild(document.createElement('li'));
    item.dataset.filter = `${flay.studio} ${flay.actressList.join(' ')} ${flay.release.substring(0, 4)}`;
    item.innerHTML = `
      <div style="background-image: url(${await FlayFetch.getCoverURL(flay.opus)})">
        <label class="title"><span>${flay.title}</span></label>
        <label class="actress"><span>${flay.actressList.join(', ')}</span></label>
        <label class="shot"><span>${flay.video.likes.length}</span></label>
        <label class="studio"><span>${flay.studio}</span></label>
        <label class="opus"><span>${flay.opus}</span></label>
        <label class="release"><span>${flay.release}</span></label>
      </div>
    `;
    item.querySelector('.title')!.addEventListener('click', () => popupFlay(flay.opus));
  }
  document.querySelector('#shotFlayCount')!.innerHTML = String(shotFlayList.length);
  console.log(studioMap, actressMap, releaseMap);

  document.querySelector('.statistics-studio')!.textContent = null;
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

      document.querySelector('.statistics-studio')!.append(input, label);
    });

  document.querySelector('.statistics-actress')!.textContent = null;
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

      document.querySelector('.statistics-actress')!.append(input, label);
    });

  document.querySelector('.statistics-release')!.textContent = null;
  releaseMap.forEach((value, key) => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'release';
    input.id = 'release' + key;
    input.value = key;

    const label = document.createElement('label');
    label.setAttribute('for', 'release' + key);
    label.innerHTML = `<span>${key}</span> <span>${value.shotSum}</span> <span>${value.shotLength}</span>`;

    document.querySelector('.statistics-release')!.append(input, label);
  });

  document.querySelectorAll('.statistics input').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      if (document.querySelectorAll('.statistics input:checked').length === 0) {
        wrapper.querySelectorAll('li').forEach((li) => li.classList.remove('hide'));
        document.querySelectorAll('.statistics input').forEach((input) => ((input as HTMLInputElement).disabled = false));
      } else {
        const checkedFilterWords = Array.from(document.querySelectorAll('.statistics input:checked')).map((checkbox) => (checkbox as HTMLInputElement).value);
        wrapper.querySelectorAll('li').forEach((li) => {
          let found = true;
          checkedFilterWords.forEach((word) => {
            found = found && li.dataset.filter!.includes(word);
          });
          li.classList.toggle('hide', !found);
        });

        const filteredStudio = new Set();
        const filteredActress = new Set();
        const filteredRelease = new Set();
        wrapper.querySelectorAll('li:not(.hide)').forEach((li) => {
          filteredStudio.add(li.querySelector('.studio')!.textContent);
          li.querySelector('.actress')!
            .textContent!.split(', ')
            .forEach((name) => filteredActress.add(name));
          filteredRelease.add(li.querySelector('.release')!.textContent!.substring(0, 4));
        });
        console.log(filteredStudio, filteredActress, filteredRelease);

        document.querySelectorAll('.statistics-studio input').forEach((element) => {
          const input = element as HTMLInputElement;
          input.disabled = !filteredStudio.has(input.value);
        });
        document.querySelectorAll('.statistics-actress input').forEach((element) => {
          const input = element as HTMLInputElement;
          input.disabled = !filteredActress.has(input.value);
        });
        document.querySelectorAll('.statistics-release input').forEach((element) => {
          const input = element as HTMLInputElement;
          input.disabled = !filteredRelease.has(input.value);
        });
      }

      document.querySelector('#shotFlayCount')!.innerHTML = String(wrapper.querySelectorAll('li:not(.hide)').length);
    });
  });
}

function startLastDate() {
  document.querySelector('#lastDate')!.textContent = null;
  document.querySelector('#lastDate')!.appendChild(new VideoDatePanel(filteredList));
}

function startChart() {
  void FlayFetch.getFlayAll().then((flayList) => {
    /**
     * 통계 계산 및 차트 생성 공통 함수
     */
    const createStatisticsChart = (title: string, values: number[], createCountsMap: (values: number[]) => Map<number, number>, formatLabel: (key: number) => string, container: Element) => {
      if (values.length === 0) return;

      // 통계 계산
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // 중앙값 계산
      const sortedValues = [...values].sort((a, b) => a - b);
      const median = sortedValues.length % 2 === 0 ? (sortedValues[sortedValues.length / 2 - 1]! + sortedValues[sortedValues.length / 2]!) / 2 : sortedValues[Math.floor(sortedValues.length / 2)]!;

      // 개수 집계
      const countsMap = createCountsMap(values);

      console.log(`${title} (총 ${values.length}개)`);
      console.log(`평균: ${mean.toFixed(2)}, 중앙값: ${median.toFixed(2)}, 표준편차: ${stdDev.toFixed(2)}`);

      // 차트 데이터 변환
      const chartData = Array.from(countsMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([key, count]) => {
          const percentage = ((count / values.length) * 100).toFixed(1);
          return {
            label: formatLabel(key),
            count,
            percentage: parseFloat(percentage),
          };
        });

      // 화면에 차트 추가
      const chart = createHistogramChart(title, chartData, { mean, median, stdDev, total: values.length });
      container.appendChild(chart);
    };

    // 재생 횟수 분포 차트
    const playValues = flayList.map((flay) => flay.video.play || 0);
    createStatisticsChart(
      '재생 횟수 분포',
      playValues,
      (values) => {
        const countsMap = new Map<number, number>();
        values.forEach((play) => {
          countsMap.set(play, (countsMap.get(play) ?? 0) + 1);
        });
        return countsMap;
      },
      (play) => `${play}회`,
      document.querySelector('#chart')!
    );

    // 랭크 분포 차트
    const rankValues = flayList.map((flay) => flay.video.rank || 0);
    createStatisticsChart(
      '랭크 분포',
      rankValues,
      () => {
        const countsMap = new Map<number, number>();
        for (let i = -1; i <= 5; i++) {
          countsMap.set(i, 0);
        }
        rankValues.forEach((rank) => {
          countsMap.set(rank, (countsMap.get(rank) ?? 0) + 1);
        });
        return countsMap;
      },
      (rank) => `랭크 ${rank}`,
      document.querySelector('#chart')!
    );
  });
}
