/**
 * flay summary js
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import bootstrap from 'bootstrap/dist/js/bootstrap';
import './lib/crazy.jquery';
import './components/FlayMenu';
import './css/common.scss';
import './flay.summary.scss';

import './lib/jquery.tagcanvas-flay';

import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5locales_ko_KR from '@amcharts/amcharts5/locales/ko_KR';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

import { Rest } from './lib/flay.rest.service.js';
import { Random, File, NumberUtils } from './lib/crazy.common.js';
import { View } from './lib/flay.utils.js';
import { STUDIO, ACTRESS_EXTRA, MODIFIED, RANK, COMMENT, FILEINFO } from './lib/flay.view.card.js';

const filterCount = 5;

let instanceList = [];
let archiveList = [];
let actressList = [];

let allFlayList = [];
let studioArray = [];
let actressArray = [];

Promise.all([
  new Promise((resolve, reject) => {
    Rest.Flay.list(resolve);
  }),
  new Promise((resolve, reject) => {
    Rest.Archive.list(resolve);
  }),
  new Promise((resolve, reject) => {
    Rest.Actress.list(resolve);
  }),
]).then((result) => {
  [instanceList, archiveList, actressList] = result;
  allFlayList = [...instanceList, ...archiveList];

  console.log('Rest.Flay.list', instanceList.length);
  console.log('Rest.Archive.list', archiveList.length);
  console.log('Rest.Actress.list', actressList.length);

  loadStudioArray();
  loadActressArray();
});

function loadStudioArray() {
  const studioMap = {};
  allFlayList.forEach((flay) => {
    const key = flay.studio;
    if (studioMap[key]) {
      studioMap[key].push(flay);
    } else {
      studioMap[key] = [flay];
    }
  });

  $.each(studioMap, function (name, flayList) {
    studioArray.push({
      key: name,
      list: flayList,
    });
  });
  studioArray.sort(function (d1, d2) {
    return d2.list.length - d1.list.length;
  });
}

function loadActressArray() {
  const actressMap = {};
  allFlayList.forEach((flay) => {
    const keys = flay.actressList;
    for (var x in keys) {
      if (keys[x] === 'Amateur') {
        continue;
      }
      if (actressMap[keys[x]]) {
        actressMap[keys[x]].push(flay);
      } else {
        actressMap[keys[x]] = [flay];
      }
    }
  });

  $.each(actressMap, function (name, flayList) {
    actressArray.push({
      key: name,
      list: flayList,
    });
  });
  actressArray.sort(function (d1, d2) {
    return d2.list.length - d1.list.length;
  });
}

document.getElementById('groupByRelease').addEventListener('show.bs.collapse', function () {
  var val = $("input[name='releasePattern']:checked").val();
  if (typeof val === 'undefined') {
    $("input[name='releasePattern']").first().click();
  }
});

$("input[name='releasePattern']").on('change', function () {
  var releasePattern = $("input[name='releasePattern']:checked").val();
  var getReleaseKey = function (release) {
    if ('YYYY' === releasePattern) {
      return release.substring(0, 4);
    } else if ('YYYYMM' === releasePattern) {
      return release.substring(0, 7);
    } else {
      return release;
    }
  };
  var $list = $('#releasedList').empty();

  var dataMap = {};
  $.each(instanceList, function (idx, flay) {
    var key = getReleaseKey(flay.release);
    if (dataMap[key]) {
      dataMap[key].push(flay);
    } else {
      dataMap[key] = [flay];
    }
  });

  displaySummaryTableView(dataMap, $list);
});

document.getElementById('groupByPath').addEventListener('show.bs.collapse', function () {
  var getPathKey = function (files) {
    var file;
    if (files.movie.length > 0) {
      file = files.movie[0];
    } else {
      file = files.cover[0];
    }
    var pathArray = file.replace(/\\/gi, '/').split('/');
    pathArray.pop();
    var key = pathArray.join('/');
    if (key.indexOf('/Storage/') > -1) {
      pathArray.pop();
      key = pathArray.join('/');
    }
    return key;
  };
  var $list = $('#pathList').empty();

  var dataMap = {};
  $.each(instanceList, function (idx, flay) {
    var key = getPathKey(flay.files);
    if (dataMap[key]) {
      dataMap[key].push(flay);
    } else {
      dataMap[key] = [flay];
    }
  });

  displaySummaryTableView(dataMap, $list);
});

document.getElementById('groupByRank').addEventListener('show.bs.collapse', function (e) {
  var $list = $('#rankList').empty();

  var dataMap = {};
  $.each(instanceList, function (idx, flay) {
    var key = 'Rank ' + flay.video.rank;
    if (dataMap[key]) {
      dataMap[key].push(flay);
    } else {
      dataMap[key] = [flay];
    }
  });

  displaySummaryTableView(dataMap, $list);
});

document.getElementById('groupByStudio').addEventListener('show.bs.collapse', function () {
  const $list = $('#studioList').empty();

  let displayCount = 0;
  studioArray.forEach((data) => {
    const studioName = data.key;
    const flayList = data.list.filter((flay) => !flay.archive);

    // instance가 최소 갯수 이상만
    if (flayList.length <= filterCount) {
      return;
    }

    displayCount++;

    const tagWeight = flayList.length > 100 ? 60 : flayList.length < 20 ? 10 : flayList.length / 2;

    $('<a>', {
      'data-weight': Math.round(tagWeight),
    })
      .append(studioName + ' (' + flayList.length + ')')
      .on('click', function (e) {
        e.preventDefault();
        View.studio(studioName);
      })
      .appendTo($list);
  });

  $('.studio-count').html(displayCount + ' / ' + studioArray.length);
  $('.filter-count').html(filterCount);

  var wOpts = {
    interval: 20,
    //			textFont: '"Ink Free", Impact,"Arial Black",sans-serif',
    textColour: '#00f',
    textHeight: 15,
    outlineColour: '#f96',
    outlineThickness: 5,
    outlineRadius: 4,
    maxSpeed: 0.03,
    minSpeed: 0.001,
    minBrightness: 0.1,
    depth: 0.92,
    pulsateTo: 0.2,
    pulsateTime: 0.75,
    initial: [0.1, -0.1],
    decel: 0.98,
    reverse: true,
    hideTags: false,
    shadow: '#ccf',
    shadowBlur: 3,
    shuffleTags: true,
    wheelZoom: true,
    clickToFront: 300,
    weight: true,
    weightMode: 'both',
    weightFrom: 'data-weight',
  };
  // http://www.goat1000.com/tagcanvas-weighted.php
  $('#studioCanvas').tagcanvas(wOpts, 'studioList');
});
document.getElementById('groupByStudio').addEventListener('hide.bs.collapse', function () {
  $('#studioCanvas').tagcanvas('delete');
});

document.getElementById('StudioTable').addEventListener('show.bs.collapse', function () {
  const $tbody = $('#studioTableWrap tbody').empty();

  let displayCount = 0;
  studioArray.forEach((data) => {
    const studioName = data.key;

    const totalList = data.list;
    const instanceList = [];
    const favoriteList = [];

    totalList.forEach((flay) => {
      if (!flay.archive) {
        instanceList.push(flay);
        if (isFavoriteActress(flay.actressList)) {
          favoriteList.push(flay);
        }
      }
    });

    // instance가 최소 갯수 이상만
    if (instanceList.length <= filterCount) {
      return;
    }

    displayCount++;

    const tot = NumberUtils.calculateStandardDeviation(...totalList.map((flay) => flay.video.rank));
    const ins = NumberUtils.calculateStandardDeviation(...instanceList.map((flay) => flay.video.rank));
    const fav = NumberUtils.calculateStandardDeviation(...favoriteList.map((flay) => flay.video.rank));

    $('<tr>')
      .append(
        $('<td>').html(studioName),

        $('<td>').html(tot.cnt),
        $('<td>').html(tot.avg.toFixed(1)),
        $('<td>').html(tot.sd.toFixed(1)),

        $('<td>').html(ins.cnt),
        $('<td>').html(ins.avg.toFixed(1)),
        $('<td>').html(ins.sd.toFixed(1)),
        $('<td>').html(Math.round((ins.cnt / tot.cnt) * 100) + '%'),

        $('<td>').html(fav.cnt),
        $('<td>').html(fav.avg.toFixed(1)),
        $('<td>').html(fav.sd.toFixed(1)),
        $('<td>').html(Math.round((fav.cnt / tot.cnt) * 100) + '%')
      )
      .on('click', function () {
        displayFlayList(studioName, instanceList);
      })
      .appendTo($tbody);
  });

  $tbody.find('td').each((idx, td) => {
    const text = td.innerText;
    if (text === 'NaN') {
      $(td).css('color', 'var(--bs-secondary)');
    } else if (text.startsWith('-')) {
      $(td).css('color', 'var(--bs-danger)');
    }
  });

  $('.studio-count').html(displayCount + ' / ' + studioArray.length);
  $('.filter-count').html(filterCount);
});

document.getElementById('groupByActress').addEventListener('show.bs.collapse', function () {
  const $list = $('#actressList').empty();

  let displayCount = 0;
  actressArray.forEach((data) => {
    const actressName = data.key;
    const flayList = data.list.filter((flay) => !flay.archive);

    // instance가 최소 갯수 이상만
    if (flayList.length <= filterCount) {
      return;
    }

    displayCount++;

    const tagWeight = flayList.length > 60 ? 60 : flayList.length < 10 ? 9 : flayList.length;

    $('<a>', {
      'data-weight': Math.round(tagWeight),
    })
      .append(data.key + ' (' + flayList.length + ')')
      .on('click', function (e) {
        e.preventDefault();
        View.actress(data.key);
      })
      .appendTo($list);
  });

  $('.actress-count').html(displayCount + ' / ' + actressArray.length);
  $('.filter-count').html(filterCount);

  var wOpts = {
    interval: 20,
    textColour: '#00f',
    textHeight: 15,
    outlineColour: '#f96',
    outlineThickness: 5,
    outlineRadius: 4,
    maxSpeed: 0.03,
    minSpeed: 0.001,
    minBrightness: 0.1,
    depth: 0.92,
    pulsateTo: 0.2,
    pulsateTime: 0.75,
    initial: [0.1, -0.1],
    decel: 0.98,
    reverse: true,
    hideTags: false,
    shadow: '#ccf',
    shadowBlur: 3,
    shuffleTags: true,
    wheelZoom: true,
    clickToFront: 300,
    weight: true,
    weightMode: 'both',
    weightFrom: 'data-weight',
  };

  $('#actressCanvas').tagcanvas(wOpts, 'actressList');
});
document.getElementById('groupByActress').addEventListener('hide.bs.collapse', function () {
  $('#actressCanvas').tagcanvas('delete');
});

document.getElementById('ActressTable').addEventListener('show.bs.collapse', function () {
  var $tbody = $('#actressTableWrap tbody').empty();

  let displayCount = 0;

  actressArray.forEach((data) => {
    const actressName = data.key;

    const totalList = data.list;
    const instanceList = [];

    totalList.forEach((flay) => {
      if (!flay.archive) {
        instanceList.push(flay);
      }
    });

    // instance가 최소 갯수 이상만
    if (instanceList.length <= filterCount) {
      return;
    }

    displayCount++;

    const tot = NumberUtils.calculateStandardDeviation(...totalList.map((flay) => flay.video.rank));
    const ins = NumberUtils.calculateStandardDeviation(...instanceList.map((flay) => flay.video.rank));

    $('<tr>')
      .append(
        $('<td>').html(actressName),

        $('<td>').html(tot.cnt),
        $('<td>').html(tot.avg.toFixed(1)),
        $('<td>').html(tot.sd.toFixed(1)),

        $('<td>').html(ins.cnt),
        $('<td>').html(ins.avg.toFixed(1)),
        $('<td>').html(ins.sd.toFixed(1)),
        $('<td>').html(Math.round((ins.cnt / tot.cnt) * 100) + '%')
      )
      .on('click', function () {
        displayFlayList(actressName, instanceList);
      })
      .appendTo($tbody);
  });

  $tbody.find('td').each((idx, td) => {
    const text = td.innerText;
    if (text === 'NaN') {
      $(td).css('color', 'var(--bs-secondary)');
    } else if (text.startsWith('-')) {
      $(td).css('color', 'var(--bs-danger)');
    }
  });

  $('.actress-count').html(displayCount + ' / ' + actressArray.length);
  $('.filter-count').html(filterCount);
});

function displaySummaryTableView(dataMap, $list) {
  const dataArray = [];
  const isReleaseView = $list.attr('id') === 'releasedList';
  let maxFlayCount = 0;
  let totalFlayCount = 0;
  let totalFlayLength = 0;
  let totalUnRankCount = 0;

  $.each(dataMap, function (key, val) {
    var fileLength = (function (flayList) {
      var length = 0;
      for (const flay of flayList) {
        length += flay.length;
      }
      return length;
    })(val);

    var unRank = (function (flayList) {
      var unRankCount = 0;
      for (const flay of flayList) {
        unRankCount += flay.video.rank === 0 ? 1 : 0;
      }
      return unRankCount;
    })(val);

    dataArray.push({
      key: key,
      list: val,
      length: fileLength,
      unRank: unRank,
    });

    maxFlayCount = Math.max(maxFlayCount, val.length);
    totalFlayCount += val.length;
    totalFlayLength += fileLength;
    totalUnRankCount += unRank;
  });

  dataArray.sort(function (d1, d2) {
    return d2.key.localeCompare(d1.key);
  });

  console.table(dataArray);

  $.each(dataArray, function (idx, data) {
    const percent = (data.list.length / totalFlayCount) * 100;
    $('<tr>')
      .append(
        $('<td>', { class: 'item-key nowrap' }).append(
          $('<span>', { class: 'hover' })
            .html(data.key)
            .on('click', function () {
              displayFlayList(data.key, data.list);
            })
        ),
        $('<td>', { class: 'item-count' })
          .html((isReleaseView ? data.unRank + ' / ' : '') + data.list.length)
          .css('text-align', isReleaseView ? 'center' : 'right'),
        $('<td>', { class: 'item-length' }).html(File.formatSize(data.length)),
        $('<td>', { class: 'item-progress' }).append(
          $('<div>', { class: 'progress', title: percent.toFixed(1) + '%' }).append(
            $('<div>', { class: 'progress-bar' }).css({
              width: Math.max(percent, 1) + '%',
            })
          )
        )
      )
      .appendTo($list);
  });
  $list
    .next()
    .empty()
    .append(
      $('<th>'),
      $('<th>')
        .html((isReleaseView ? totalUnRankCount + ' / ' : '') + totalFlayCount)
        .css('text-align', isReleaseView ? 'center' : 'right'),
      $('<th>').html(File.formatSize(totalFlayLength)),
      $('<th>')
    );
}

function isFavoriteActress(nameArray) {
  for (let actress of actressList) {
    for (let name of nameArray) {
      if (actress.name === name) {
        return actress.favorite;
      }
    }
  }
  return false;
}

function displayFlayList(key, list, start) {
  if (!list || list.length === 0) {
    return;
  }

  $('#flayListModalLabel').html(key + ' - ' + list.length);
  const $flayList = $('#flayList');
  const ONE_PAGE = 21;
  if (!start) {
    start = 0;
    $flayList.empty();
  }
  const end = Math.min(start + ONE_PAGE, list.length);
  console.log('displayFlayList', key, list.length, start, end);

  for (let i = start; i < end; i++) {
    $flayList.appendFlayCard(list[i], {
      width: 310,
      exclude: [STUDIO, ACTRESS_EXTRA, MODIFIED, RANK, COMMENT, FILEINFO],
      fontSize: '80%',
    });
  }

  $('#moreFlayList')
    .toggle(end < list.length)
    .html('Mode ' + (list.length - end) + 'flay')
    .off('click')
    .on('click', function () {
      displayFlayList(key, list, end);
    });

  const myModal = new bootstrap.Modal('#flayListModal', {
    backdrop: false,
  });
  myModal.show();
}

let root = am5.Root.new('releaseChart');
root.setThemes([am5themes_Animated.new(root)]);
root.locale = am5locales_ko_KR;

// ---- flay release chart
document.getElementById('releaseChartDiv').addEventListener('show.bs.collapse', () => {
  const instanceDataMap = new Map();
  instanceList.forEach((flay) => {
    const key = flay.release;
    if (key) {
      if (instanceDataMap.has(key)) {
        instanceDataMap.get(key).push(flay);
      } else {
        instanceDataMap.set(key, [flay]);
      }
    } else {
      console.warn('release in null', flay);
    }
  });

  const instanceData = [];
  instanceDataMap.forEach((val, key) => {
    instanceData.push({
      date: new Date(key).getTime(),
      value: val.length,
    });
  });
  instanceData.sort((d1, d2) => (d1.date > d2.date ? 1 : -1));

  root.container.children.clear();
  let chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'panX',
      wheelY: 'zoomX',
    })
  );

  let cursor = chart.set(
    'cursor',
    am5xy.XYCursor.new(root, {
      behavior: 'zoomX',
    })
  );
  cursor.lineY.set('visible', false);

  let xAxis = chart.xAxes.push(
    am5xy.DateAxis.new(root, {
      maxDeviation: 0,
      baseInterval: {
        timeUnit: 'day',
        count: 1,
      },
      renderer: am5xy.AxisRendererX.new(root, {}),
      tooltip: am5.Tooltip.new(root, {}),
    })
  );

  let yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {}),
    })
  );

  let instanceSeries = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: 'Instance',
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: 'value',
      valueXField: 'date',
      tooltip: am5.Tooltip.new(root, {
        labelText: '{valueY}',
      }),
    })
  );

  chart.set(
    'scrollbarX',
    am5.Scrollbar.new(root, {
      orientation: 'horizontal',
    })
  );

  instanceSeries.data.setAll(instanceData);
  instanceSeries.appear(1000);
  chart.appear(1000, 100);
});

// ---- flay all dislay
document.getElementById('flayAllDiv').addEventListener('show.bs.collapse', function () {
  displayFlayAllTable();
  displayFlayAllMetrix();
});

function displayFlayAllMetrix() {
  const $flayAllWrapper = $('#flayAllWrapper').empty();
  const $flayAllAxisWrapper = $('#flayAllAxisWrapper').empty();
  const $progressBar = $('#displayProgress > .progress-bar').css({ style: '0%' });

  const tableMap = new Map();
  const flayAllList = archiveList.concat(...instanceList);
  const flayAllListCount = flayAllList.length;
  console.log('displayFlayAll', 'flayAllList', flayAllListCount);

  let minYear = 9999;
  let maxYear = 0;
  flayAllList.forEach((flay) => {
    const releaseYear = Number(flay.release.substring(0, 4));
    minYear = Math.min(minYear, releaseYear);
    maxYear = Math.max(maxYear, releaseYear);
    if (flay.archive) {
      flay.video.rank = -1;
    }
    flay.cellId = 'r' + flay.video.rank + 'y' + releaseYear;

    if (!tableMap.has(flay.cellId)) {
      tableMap.set(flay.cellId, []);
    }
    tableMap.get(flay.cellId).push(flay);
  });

  const cellColumnCount = maxYear - minYear + 1;
  console.log('displayFlayAll', 'minYear', minYear, 'maxTear', maxYear, 'cellColumnCount', cellColumnCount, 'tableMap', tableMap);

  for (let r = 5; r >= -2; r--) {
    for (let y = minYear; y <= maxYear; y++) {
      if (r === -2) {
        $flayAllAxisWrapper.append(`<div class="flay-all-cell-year-axis" id="y${y}" style="width: calc(100% / ${cellColumnCount});">${y}</div>`);
      } else {
        $flayAllWrapper.append(`<div class="flay-all-cell rank${r}" style="width: calc(100% / ${cellColumnCount});" id="r${r}y${y}" title="${y}: r${r}"></div>`);
        if (!tableMap.has(`r${r}y${y}`)) {
          tableMap.set(`r${r}y${y}`, []);
        }
      }
    }
  }

  const displayTimerId = setInterval(() => {
    for (let i = 0; i < 10; i++) {
      const pickIndex = Random.getInteger(0, flayAllList.length - 1);
      const flay = flayAllList.splice(pickIndex, 1)[0];

      const $cell = $('#' + flay.cellId);
      const count = Number($cell.text()) + 1;
      $cell.html(count);

      if (flayAllList.length % 100 === 0 || flayAllList.length === 0) {
        $progressBar.css({
          width: ((flayAllListCount - flayAllList.length) / flayAllListCount) * 100 + '%',
        });
      }

      if (flayAllList.length === 0) {
        clearInterval(displayTimerId);
        break;
      }
    }
  });

  $('.flay-all-cell').on('click', (e) => {
    console.log('displayFlayAll', 'cell click', e.target.id, tableMap.get(e.target.id).length);
    displayFlayList(e.target.id, tableMap.get(e.target.id));
  });

  $('.flay-all-cell-year-axis').each(function () {
    let totalCount = 0;
    for (let r = 5; r >= -1; r--) {
      totalCount += tableMap.get('r' + r + this.id).length;
    }
    $(this)
      .html($(this).html() + '<br><span class="small my-1">' + totalCount + '</span>')
      .on('click', function () {
        location.href = '#tr-' + this.id + '.12';
      });
  });
}

function displayFlayAllTable() {
  const getPreviousMonthKey = (yyyyMM) => {
    const previousVal = yyyyMM - 0.01;
    const roundVal = Math.round(previousVal);
    if (previousVal === roundVal) {
      return roundVal - 1 + 0.12;
    } else {
      return previousVal;
    }
  };
  const $flayAllTableBody = $('#flayAllTableBody').empty();

  const tableMap = new Map();
  const flayAllList = archiveList.concat(...instanceList);
  const flayAllListCount = flayAllList.length;
  console.log('displayFlayAllTable', 'flayAllList', flayAllListCount);

  let minRelease = 9999.12;
  let maxRelease = 0.0;
  flayAllList.forEach((flay, index) => {
    const releaseKey = Number(flay.release.substring(0, 7).replace(/-/g, '.').replace(/,/g, '.'));
    minRelease = Math.min(minRelease, releaseKey);
    maxRelease = Math.max(maxRelease, releaseKey);
    if (!minRelease) {
      console.log(releaseKey, minRelease, maxRelease, flay);
    }
    if (flay.archive) {
      flay.video.rank = -1;
    }
    flay.cellId = 'r' + flay.video.rank + 'd' + releaseKey.toFixed(2);

    if (!tableMap.has(flay.cellId)) {
      tableMap.set(flay.cellId, []);
    }
    tableMap.get(flay.cellId).push(flay);
  });
  console.log('displayFlayAllTable', 'minRelease', minRelease, 'maxRelease', maxRelease, 'tableMap', tableMap);

  let curRelease = maxRelease;
  do {
    // console.log('displayFlayAllTable', 'curRelease', curRelease);
    const yyyyMM = curRelease.toFixed(2);
    const r_1 = tableMap.has('r-1d' + yyyyMM) ? tableMap.get('r-1d' + yyyyMM).length : '';
    const r0 = tableMap.has('r0d' + yyyyMM) ? tableMap.get('r0d' + yyyyMM).length : '';
    const r1 = tableMap.has('r1d' + yyyyMM) ? tableMap.get('r1d' + yyyyMM).length : '';
    const r2 = tableMap.has('r2d' + yyyyMM) ? tableMap.get('r2d' + yyyyMM).length : '';
    const r3 = tableMap.has('r3d' + yyyyMM) ? tableMap.get('r3d' + yyyyMM).length : '';
    const r4 = tableMap.has('r4d' + yyyyMM) ? tableMap.get('r4d' + yyyyMM).length : '';
    const r5 = tableMap.has('r5d' + yyyyMM) ? tableMap.get('r5d' + yyyyMM).length : '';
    const rt = Number(r_1) + Number(r0) + Number(r1) + Number(r2) + Number(r3) + Number(r4) + Number(r5);
    $flayAllTableBody.append(`
				<tr id="tr-y${yyyyMM}">
					<td>${yyyyMM}</td>
					<td><span id="r-1d${yyyyMM}" class="flay-all-td rank-1">${r_1}</span></td>
					<td><span id="r0d${yyyyMM}" class="flay-all-td rank0">${r0}</span></td>
					<td><span id="r1d${yyyyMM}" class="flay-all-td rank1">${r1}</span></td>
					<td><span id="r2d${yyyyMM}" class="flay-all-td rank2">${r2}</span></td>
					<td><span id="r3d${yyyyMM}" class="flay-all-td rank3">${r3}</span></td>
					<td><span id="r4d${yyyyMM}" class="flay-all-td rank4">${r4}</span></td>
					<td><span id="r5d${yyyyMM}" class="flay-all-td rank5">${r5}</span></td>
					<td><span id="d${yyyyMM}">${rt}</span></td>
				</tr>
			`);
    curRelease = getPreviousMonthKey(curRelease);
  } while (curRelease >= minRelease);

  $('.flay-all-td').on('click', (e) => {
    console.log('displayFlayAllTable', 'td click', e.target.id);
    displayFlayList(e.target.id, tableMap.get(e.target.id));
  });
}
