/**
 * flay.score.html
 */

import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';

import './components/FlayMenu';
import { birthRegExp, bodyRegExp, DateUtils, debutRegExp, File, GB, heightRegExp } from './lib/crazy.common.js';
import './lib/crazy.jquery';
import { Rest, restCall } from './lib/flay.rest.service.js';
import { Util, View } from './lib/flay.utils.js';

import './flay.score.scss';
import './styles/common.scss';

let flayProperties;
let flayList = [];
let actressList = [];

const actressMap = new Map();

Promise.all([
  new Promise((resolve, reject) => {
    restCall('/config', {}, resolve, reject);
  }),
  new Promise((resolve, reject) => {
    Rest.Actress.list(resolve, reject);
  }),
  new Promise((resolve, reject) => {
    restCall('/flay/list/orderbyScoreDesc', {}, resolve, reject);
  }),
]).then(([config, retActressList, retFlayList]) => {
  flayProperties = config;
  actressList = retActressList;
  flayList = retFlayList;

  actressList.forEach((actress) => {
    actressMap.set(actress.name, actress);
  });

  $('#storageLimit').html(flayProperties.storageLimit);

  displayFlay();
  displayActress();

  // view type
  $('input[name="viewType"]').on('change', function () {
    const viewType = $(this).val();
    if (viewType === 'f') {
      $('#flayView, #flayListOptions').show();
      $('#actressView').hide();
    } else if (viewType === 'a') {
      $('#flayView, #flayListOptions').hide();
      $('#actressView').show();
    }
  });
  $('input[name="viewType"][value="f"]').click();
});

$(window).on('keyup', (e) => {
  console.log('key', e.keyCode, e.key);
  // arrow up(38), down(40)
  if (e.keyCode === 40 || e.keyCode === 38) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const $active = $('.f-body > div.active');
    if ($active.length > 0) {
      if ($('#flayInPage').is(':visible')) {
        if (e.keyCode === 38) {
          $active.prev().find('.flay-title > span').click();
        } else if (e.keyCode === 40) {
          $active.next().find('.flay-title > span').click();
        }
      } else {
        if (e.keyCode === 38) {
          $active.prev().click();
        } else if (e.keyCode === 40) {
          $active.next().click();
        }
      }
      const position = $('.f-body > div.active').position();
      // console.log('this top', position.top, 'window height', window.innerHeight);
      if (e.keyCode === 38) {
        window.scroll(0, position.top - window.innerHeight + 100);
      } else if (e.keyCode === 40) {
        window.scroll(0, position.top - 100);
      }
    }
  } else if (96 <= e.keyCode && e.keyCode <= 110) {
    let rank;
    switch (e.keyCode) {
      case 96: // 0
        rank = '0';
        break;
      case 97: // 1
        rank = '1';
        break;
      case 98: // 2
        rank = '2';
        break;
      case 99: // 3
        rank = '3';
        break;
      case 100: // 4
        rank = '4';
        break;
      case 101: // 5
        rank = '5';
        break;
      case 109: // -
        rank = '-1';
        break;
      default:
        break;
    }
    $(`input[name^="flay-rank-"][value="${rank}"]`).click();
  }
});

function displayFlay() {
  const storageLimitGB = flayProperties.storageLimit * GB;
  let lengthSum = 0;
  flayList.forEach((flay, idx) => {
    lengthSum += flay.length;
    $('#flayView .f-body').append(getFlayRecordObject(idx, flay, lengthSum, storageLimitGB));
  });
  $('#flayCount').html(flayList.length);

  $('.flay-actress > span').hover(
    function (e) {
      const currName = $(this).text();
      $('.flay-actress > span').each(function () {
        $(this).toggleClass('same-name', $(this).text() === currName);
      });
    },
    function (e) {
      $('.flay-actress > span').removeClass('same-name');
    }
  );

  // only lower score view
  $('#lowerScore').on('change', function (e) {
    e.stopPropagation();
    var checked = this.checked;
    $('#flayView > .f-body > div:not(.lower-score)').toggle(!checked);
    $('#flayCount').html($('#flayView > .f-body > div:visible').length);
    console.debug('lowerScore changed', checked);
  });

  $('#clickNplay').on('change', (e) => {
    e.stopPropagation();
    console.debug('clickNplay changed', e.target.checked);
  });

  // toggle column
  $('#flayView > .f-head > div > label').on('click', (e) => {
    e.stopPropagation();
    if ('LABEL' === e.target.tagName) {
      const className = $(e.target).attr('class');
      $('.' + className.replace(/ /g, '.')).toggleClass('active');
      console.debug('head column click', e.target.tagName);
    }
  });
}

function displayActress() {
  const getScoreOfAll = (flayArray) => {
    let score = { total: 0, avg: 0 };
    flayArray.forEach((flay) => {
      score.total += flay.score;
    });
    score.avg = parseInt(score.total / flayArray.length);
    return score;
  };

  const actressFlayMap = new Map();
  flayList.forEach((flay) => {
    flay.actressList.forEach((name) => {
      if (!actressFlayMap.has(name)) {
        actressFlayMap.set(name, new Array());
      }
      actressFlayMap.get(name).push(flay);
    });
  });
  $('#actressCount').html(actressFlayMap.size);

  let actressByScore = [];
  for (var [name, flayArray] of actressFlayMap) {
    let actress = actressMap.get(name);
    let score = getScoreOfAll(flayArray);
    actress['scoreTotal'] = score.total;
    actress['flayCount'] = flayArray.length;
    actress['scoreAvg'] = score.avg;
    actressByScore.push(actress);
  }

  // only favorite actress view
  $('#actressView > .f-head > div > .actress-favorite').on('click', () => {
    $("#actressView > .f-body > div[data-favorite='false']").toggle();
    $('#actressCount').html($('#actressView > .f-body > div:visible').length);
  });
  // sort
  $('input[name="actressSort"]').on('change', function () {
    const sortMethod = $(this).val();
    actressByScore.sort(function (a1, a2) {
      switch (sortMethod) {
        case 't':
          return a2.scoreTotal - a1.scoreTotal;
        case 'f':
          return a2.flayCount - a1.flayCount;
        case 'a':
          return a2.scoreAvg - a1.scoreAvg;
        default:
          return a2.scoreTotal - a1.scoreTotal;
      }
    });

    $('#actressView .f-body').empty();
    actressByScore.forEach((actress, idx) => {
      $('#actressView .f-body').append(getActressRecordObject(idx, actress));
    });
  });
  $('input[name="actressSort"][value="t"]').click();
}

function getFlayRecordObject(idx, flay, lengthSum, storageLimitGB) {
  var actressObjectArray = Util.Actress.get(flay.actressList, 'mx-1').map(($actress) => {
    var name = $actress.text();
    var actress = actressMap.get(name);
    if (actress.favorite) {
      $actress.prepend(`<i class="fa fa-heart mr-1"><i>`);
    }
    return $actress;
  });

  return $('<div>', { id: flay.opus, class: lengthSum > storageLimitGB ? 'lower-score' : '' })
    .append(
      $('<label>', { class: 'flay-index' }).append(idx + 1),
      $('<label>', { class: 'flay-opus' }).append(
        $('<span>', { class: 'hover' })
          .on('click', function () {
            View.flay(flay.opus);
          })
          .html(flay.opus)
      ),
      $('<label>', { class: 'flay-title nowrap' }).append(
        $('<span>', { class: 'hover' })
          .html(flay.title)
          .click(function () {
            View.flayInPage(flay);
            if ($('#clickNplay').prop('checked')) {
              Rest.Flay.play(flay);
            }
          })
      ),
      $('<label>', { class: 'flay-actress nowrap' }).append(actressObjectArray),
      $('<label>', { class: 'flay-release' }).append(flay.release),
      $('<label>', { class: 'flay-modified' }).append(DateUtils.format('yy/MM/dd', flay.lastModified)),
      $('<label>', { class: 'flay-movie' }).append(flay.files.movie.length),
      $('<label>', { class: 'flay-subti' }).append(flay.files.subtitles.length),
      $('<label>', { class: 'flay-play' }).append(flay.video.play),
      $('<label>', { class: 'flay-rank' }).append(flay.video.rank),
      $('<label>', { class: 'flay-score' }).append(flay.score),
      $('<label>', { class: 'flay-studioPoint' }).append(flay.studioPoint),
      $('<label>', { class: 'flay-actressPoint' }).append(flay.actressPoint),
      $('<label>', { class: 'flay-length' }).append(File.formatSize(flay.length, 'GB')),
      $('<label>', { class: 'flay-total' }).append(File.formatSize(lengthSum, 'GB', 0))
    )
    .on('click', function () {
      $(this).parent().children().removeClass('active');
      $(this).addClass('active');
    });
}

function getActressRecordObject(idx, actress) {
  return $('<div>', { 'data-favorite': actress.favorite })
    .append(
      $('<label>', { class: 'actress-no' }).html(idx + 1),
      $('<label>', { class: 'actress-scoreTotal' }).html(actress.scoreTotal),
      $('<label>', { class: 'actress-flayCount' }).html(actress.flayCount),
      $('<label>', { class: 'actress-scoreAvg' }).html(actress.scoreAvg.toFixed(0)),
      $('<label>', { class: 'actress-favorite' }).append($('<i>', { class: 'fa fa-heart' + (actress.favorite ? ' favorite' : '-o') })),
      $('<label>', { class: 'actress-name nowrap' }).append(
        $('<span>', { class: 'hover' })
          .on('click', { name: actress.name }, function (e) {
            View.actress(e.data.name);
          })
          .html(actress.name)
      ),
      $('<label>', { class: 'actress-local nowrap' }).html(actress.localName),
      $('<label>', { class: 'actress-age' }).html(Util.Actress.getAge(actress)),
      $('<label>', { class: 'actress-birth' + (birthRegExp.test(actress.birth) ? '' : ' invalid') }).html(Util.Actress.getBirth(actress)),
      $('<label>', { class: 'actress-body' + (bodyRegExp.test(actress.body) ? '' : ' invalid') }).html(Util.Actress.getBody(actress)),
      $('<label>', { class: 'actress-height' + (heightRegExp.test(actress.height) ? '' : ' invalid') }).html(Util.Actress.getHeight(actress)),
      $('<label>', { class: 'actress-debut' + (debutRegExp.test(actress.debut) ? '' : ' invalid') }).html(Util.Actress.getDebut(actress))
    )
    .on('click', function () {
      $(this).parent().children().removeClass('active');
      $(this).addClass('active');
    });
}
