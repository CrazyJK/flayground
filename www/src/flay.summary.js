/**
 * flay summary js
 */

import $ from 'jquery';
import { Rest } from './lib/flay.rest.service.js';
import { Random, File } from './lib/crazy.common.js';
import { View } from './lib/flay.utils.js';
import { STUDIO, ACTRESS_EXTRA, MODIFIED, RANK, COMMENT, FILEINFO } from './lib/flay.view.card.js';
import './lib/jquery.tagcanvas-flay';
import './flay.summary.scss';

const filterCount = 5;

let instanceList = [];
let archiveList = [];
let actressList = [];

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
]).then(([instanceValues, archiveValues, actressValues]) => {
  instanceList = instanceValues;
  archiveList = archiveValues;
  actressList = actressValues;
  console.log('Rest.Flay.list', instanceList.length);
  console.log('Rest.Archive.list', archiveList.length);
  console.log('Rest.Actress.list', archiveList.length);
});

/*
	$(window).on("resize", function() {
		console.log("$(window).width()", $(window).width());
	//	$('canvas').attr("width", $(".card-body").width() - 64);
	}).trigger("resize");
	*/

$('#groupByRelease').on('show.bs.collapse', function () {
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

$('#groupByPath').on('show.bs.collapse', function () {
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

$('#groupByRank').on('show.bs.collapse', function (e) {
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

$('#groupByStudio')
  .on('show.bs.collapse', function () {
    var $list = $('#studioList').empty();

    var dataMap = {},
      studioCount = 0;
    $.each(instanceList, function (idx, flay) {
      var key = flay.studio;
      if (dataMap[key]) {
        dataMap[key].push(flay);
      } else {
        dataMap[key] = [flay];
        ++studioCount;
      }
    });
    $('.studio-count').html(studioCount);

    var dataArray = [];
    $.each(dataMap, function (key, val) {
      if (val.length > filterCount) {
        dataArray.push({
          key: key,
          list: val,
        });
      }
    });
    $.each(dataArray, function (idx, data) {
      var tagWeight = data.list.length > 100 ? 60 : data.list.length < 20 ? 10 : data.list.length / 2;

      $('<a>', {
        'data-weight': Math.round(tagWeight),
      })
        .append(data.key + ' (' + data.list.length + ')')
        .on('click', function (e) {
          e.preventDefault();
          View.studio(data.key);
        })
        .appendTo($list);
    });
    $('.studio-count').html(dataArray.length + ' / ' + studioCount);
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
  })
  .on('hide.bs.collapse', function () {
    $('#studioCanvas').tagcanvas('delete');
  });

$('#StudioTable')
  .on('show.bs.collapse', function () {
    var dataMap = {},
      studioCount = 0;
    $.each(instanceList, function (idx, flay) {
      var key = flay.studio;
      if (dataMap[key]) {
        dataMap[key].push(flay);
      } else {
        dataMap[key] = [flay];
        ++studioCount;
      }
    });

    var dataArray = [];
    $.each(dataMap, function (key, val) {
      if (val.length > filterCount) {
        dataArray.push({
          key: key,
          list: val,
        });
      }
    });
    dataArray.sort(function (d1, d2) {
      //		return d1.key.localeCompare(d2.key);
      return d2.list.length - d1.list.length;
    });

    $('.studio-count').html(dataArray.length + ' / ' + studioCount);
    $('.filter-count').html(filterCount);

    var $tbody = $('#studioTableWrap tbody').empty();
    $.each(dataArray, function (idx, data) {
      var flayLength = data.list.length;
      var flayFileSize = 0;
      var flayRankSum = 0;
      var flayRankLength = 0;
      var flayRankAvg = 0.0;
      var favLength = 0;
      var favFileSize = 0;
      var favRankSum = 0;
      var favRankLength = 0;
      var favRankAvg = 0.0;
      var favRatio = 0.0;

      for (let flay of data.list) {
        flayFileSize += flay.length;
        if (flay.video.rank > 0) {
          flayRankSum += flay.video.rank;
          flayRankLength++;
        }
        if (isFavoriteActress(flay.actressList)) {
          favLength++;
          favFileSize += flay.length;
          if (flay.video.rank > 0) {
            favRankSum += flay.video.rank;
            favRankLength++;
          }
        }
      }

      flayRankAvg = flayRankSum / flayRankLength;
      favRankAvg = favRankSum / favRankLength;
      favRatio = Math.round((favLength / flayLength) * 100) + '%';

      $('<tr>')
        .append(
          $('<td>').html(data.key),
          $('<td>').html(flayLength),
          $('<td>').html(File.formatSize(flayFileSize)),
          $('<td>').html(flayRankAvg > 0 ? flayRankAvg.toFixed(1) : ''),

          $('<td>').html(favLength),
          $('<td>').html(File.formatSize(favFileSize)),
          $('<td>').html(favRankAvg > 0 ? favRankAvg.toFixed(1) : ''),
          $('<td>').html(favRatio)
        )
        .on('click', function () {
          displayFlayList(data.key, data.list);
        })
        .appendTo($tbody);
    });
  })
  .on('hide.bs.collapse', function () {
    $('#studioCanvas').tagcanvas('delete');
  });

$('#groupByActress')
  .on('show.bs.collapse', function () {
    var $list = $('#actressList').empty();

    var dataMap = {},
      actressCount = 0;
    $.each(instanceList, function (idx, flay) {
      var keys = flay.actressList;
      for (var x in keys) {
        if (keys[x] === 'Amateur') {
          continue;
        }
        if (dataMap[keys[x]]) {
          dataMap[keys[x]].push(flay);
        } else {
          dataMap[keys[x]] = [flay];
          ++actressCount;
        }
      }
    });

    var dataArray = [];
    $.each(dataMap, function (key, val) {
      if (val.length > filterCount) {
        dataArray.push({
          key: key,
          list: val,
        });
      }
    });
    $.each(dataArray, function (idx, data) {
      var tagWeight = data.list.length > 60 ? 60 : data.list.length < 10 ? 9 : data.list.length;

      $('<a>', {
        'data-weight': Math.round(tagWeight),
      })
        .append(data.key + ' (' + data.list.length + ')')
        .on('click', function (e) {
          e.preventDefault();
          View.actress(data.key);
        })
        .appendTo($list);
    });
    $('.actress-count').html(dataArray.length + ' / ' + actressCount);
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
  })
  .on('hide.bs.collapse', function () {
    $('#actressCanvas').tagcanvas('delete');
  });

$('#ActressTable')
  .on('show.bs.collapse', function () {
    var dataMap = {},
      actressCount = 0;
    $.each(instanceList, function (idx, flay) {
      var keys = flay.actressList;
      for (var x in keys) {
        if (keys[x] === 'Amateur') {
          continue;
        }
        if (dataMap[keys[x]]) {
          dataMap[keys[x]].push(flay);
        } else {
          dataMap[keys[x]] = [flay];
          ++actressCount;
        }
      }
    });

    var dataArray = [];
    $.each(dataMap, function (key, val) {
      if (val.length > filterCount) {
        dataArray.push({
          key: key,
          list: val,
        });
      }
    });
    dataArray.sort(function (d1, d2) {
      //		return d1.key.localeCompare(d2.key);
      return d2.list.length - d1.list.length;
    });

    $('.actress-count').html(dataArray.length + ' / ' + actressCount);
    $('.filter-count').html(filterCount);

    var $tbody = $('#actressTableWrap tbody').empty();
    $.each(dataArray, function (idx, data) {
      var flayLength = data.list.length;
      var flayFileSize = 0;
      var filteredLength = 0;
      var filteredFileSize = 0;
      var filteredRankSum = 0;
      var filteredRankLength = 0;
      var filteredRankAvg = 0.0;

      for (let flay of data.list) {
        flayFileSize += flay.length;
        if (flay.video.rank > 0) {
          filteredLength++;
          filteredFileSize += flay.length;
          filteredRankSum += flay.video.rank;
          filteredRankLength++;
        }
      }

      filteredRankAvg = filteredRankSum / filteredRankLength;

      $('<tr>')
        .append($('<td>').html(data.key), $('<td>').html(flayLength), $('<td>').html(File.formatSize(flayFileSize)), $('<td>').html(filteredLength), $('<td>').html(File.formatSize(filteredFileSize)), $('<td>').html(filteredRankAvg > 0 ? filteredRankAvg.toFixed(1) : ''))
        .on('click', function () {
          displayFlayList(data.key, data.list);
        })
        .appendTo($tbody);
    });
  })
  .on('hide.bs.collapse', function () {
    $('#studioCanvas').tagcanvas('delete');
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

  $('#groupByKey').html(key + ' - ' + list.length);
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

  // $('.flay-list-wrapper').show();
  $('.flay-list-modal').modal({
    backdrop: false,
  });
}

/*
		Flay Release List
	*/
class ReleaseDateRange {
  constructor(selector, max) {
    this.max = max;
    this.$obj = $(selector).attr('max', this.max);
  }
  set(value) {
    this.$obj.val(this.max - value);
    return this;
  }
  get() {
    return this.max - this.$obj.val();
  }
  trigger() {
    this.$obj.trigger('change');
  }
  eventOnChange(chartArray) {
    this.$obj.on('change', (e) => {
      let offset = this.max - e.target.value;
      const today = new Date();
      const startDate = new Date(today);
      const endDate = new Date(today);
      startDate.setDate(today.getDate() - offset);
      for (const chart of chartArray) {
        chart.zoomToDates(startDate, endDate);
      }
    });
  }
}

let selectedRank = [];
let selectedDateType;
const chartArray = [null, null];
const releaseDateOption = [
  { size: 4, releaseFormat: 'YYYY', dateFormat: 'YYYY', axisPeriod: 'YYYY', zoomOffsetDate: 5 * 365 },
  { size: 7, releaseFormat: 'YYYY.MM', dateFormat: 'YYYY-MM', axisPeriod: 'MM', zoomOffsetDate: 3 * 365 },
  { size: 10, releaseFormat: 'YYYY.MM.DD', dateFormat: 'YYYY-MM-DD', axisPeriod: 'DD', zoomOffsetDate: 1 * 365 },
];
const releaseDateRange = new ReleaseDateRange('#releaseDateRange', 5 * 365);

releaseDateRange.set(releaseDateOption[$('input[name="releaseDate"]:checked').val()].zoomOffsetDate).eventOnChange(chartArray);

$('#releaseChartDiv').on('show.bs.collapse', displayReleaseChart);
$('#releaseChartDiv input[name="rank"], #releaseChartDiv input[name="releaseDate"]').on('change', displayReleaseChart);

function displayReleaseChart() {
  selectedRank = [];
  $('input[name="rank"]:checked').each((index, rank) => {
    selectedRank.push(Number(rank.value));
  });
  console.log('selected Rank', selectedRank);

  selectedDateType = $('input[name="releaseDate"]:checked').val();
  console.log('selected DateType', selectedDateType, releaseDateOption[selectedDateType]);

  displayInstanceReleaseChart();
  displayArchiveReleaseChart();

  releaseDateRange.set(releaseDateOption[selectedDateType].zoomOffsetDate).trigger();
}

function displayInstanceReleaseChart() {
  // const dataMap = new Map();
  // instanceList.forEach((flay, index) => {
  //   if (!selectedRank.includes(flay.video.rank)) {
  //     return;
  //   }
  //   const key = flay.release.substring(0, releaseDateOption[selectedDateType].size);
  //   if (dataMap.has(key)) {
  //     dataMap.get(key).push(flay);
  //   } else {
  //     dataMap.set(key, [flay]);
  //   }
  // });
  // let dataArray = [];
  // dataMap.forEach((val, key) => {
  //   dataArray.push({
  //     date: AmCharts.stringToDate(key, releaseDateOption[selectedDateType].releaseFormat),
  //     flayCount: val.length,
  //   });
  // });
  // dataArray.sort((d1, d2) => d1.date - d2.date);
  // console.log('instance dataArray', dataArray);
  // renderChart(0, dataArray, 'releaseInstanceChart');
}

function displayArchiveReleaseChart() {
  // const dataMap = new Map();
  // archiveList.forEach((flay) => {
  //   const key = flay.release.substring(0, releaseDateOption[selectedDateType].size);
  //   if (dataMap.has(key)) {
  //     dataMap.get(key).push(flay);
  //   } else {
  //     dataMap.set(key, [flay]);
  //   }
  // });
  // let dataArray = [];
  // dataMap.forEach((val, key) => {
  //   dataArray.push({
  //     date: AmCharts.stringToDate(key, releaseDateOption[selectedDateType].releaseFormat),
  //     flayCount: val.length,
  //   });
  // });
  // dataArray.sort((d1, d2) => d1.date - d2.date);
  // console.log('archive dataArray', dataArray);
  // renderChart(1, dataArray, 'releaseArchiveChart');
}

function renderChart(chartIndex, dataArray, chartId) {
  // chartArray[chartIndex] = AmCharts.makeChart(chartId, {
  //   type: 'serial',
  //   theme: 'black',
  //   dataProvider: dataArray,
  //   chartScrollbar: {
  //     graph: 'flayCount',
  //     autoGridCount: true,
  //     scrollbarHeight: 40,
  //   },
  //   graphs: [
  //     {
  //       id: 'release',
  //       type: 'column',
  //       valueField: 'flayCount',
  //       fillColors: '#FFFF00',
  //       fillAlphas: 0.8,
  //       lineAlpha: 0,
  //       balloonText: '<b>[[value]]</b>',
  //       // https://docs.amcharts.com/3/javascriptcharts/AmBalloon
  //       balloon: {
  //         enabled: true,
  //         drop: true,
  //       },
  //     },
  //   ],
  //   // https://docs.amcharts.com/3/javascriptcharts/ChartCursor
  //   chartCursor: {
  //     // limitToGraph: 'flayCount',
  //     categoryBalloonDateFormat: releaseDateOption[selectedDateType].dateFormat,
  //   },
  //   // https://docs.amcharts.com/3/javascriptcharts/ValueAxis
  //   valueAxes: [
  //     {
  //       baseValue: 0,
  //       gridAlpha: 0.2,
  //       dashLength: 1,
  //       minimum: 0,
  //     },
  //   ],
  //   // https://docs.amcharts.com/3/javascriptcharts/AmSerialChart#categoryField
  //   categoryField: 'date',
  //   // https://docs.amcharts.com/3/javascriptcharts/CategoryAxis
  //   categoryAxis: {
  //     parseDates: true,
  //     minPeriod: releaseDateOption[selectedDateType].axisPeriod,
  //     dateFormats: [
  //       { period: 'DD', format: 'D' },
  //       { period: 'MM', format: 'YYYY-MM' },
  //       { period: 'YYYY', format: 'YYYY' },
  //     ],
  //   },
  // });
}

// AmCharts.dayNames = AmCharts.translations.ko.dayNames;
// AmCharts.shortDayNames = AmCharts.translations.ko.shortDayNames;
// AmCharts.monthNames = AmCharts.translations.ko.monthNames;
// AmCharts.shortMonthNames = AmCharts.translations.ko.shortMonthNames;

// ---- flay all dislay
$('#flayAllDiv').on('show.bs.collapse', () => {
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
