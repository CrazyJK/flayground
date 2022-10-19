/**
 * flay raw
 */

import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import './components/FlayMenu';
import './css/common.scss';
import './flay.raw.scss';

import { DateUtils, File, LocalStorageItem, Random } from './lib/crazy.common';
import { Rest } from './lib/flay.rest.service';
import { View } from './lib/flay.utils.js';

let opusList = [];
let indexHistory = [];
let index = -1;
let lastIndex = -1;
let previousIndex = -1;
let flay;
let jsonExpanded = true;

$('#toggleDetailSearch').on('change', (e) => {
  $('#detailSearch').toggleClass('show', e.target.checked).find('input').val('');
  $('main').toggleClass('extend', e.target.checked);
});

$('#searchInput, #studioInput, #opusInput, #titleInput, #actressInput, #releaseInput').on('keyup', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    startGround();
  }
});
$('input[name="rank"], #withFavorite, #withNoFavorite, #withSubtitles, #sort').on('change', startGround);

$(window).on('keyup wheel', (e) => {
  // console.log('[eventHandler]', e.type, e.key, e.originalEvent.deltaY);
  switch (e.key || (e.originalEvent.deltaY < 0 ? 'WheelUp' : 'WheelDown')) {
    case 'ArrowLeft':
    case 'WheelUp':
      prev();
      break;
    case 'ArrowRight':
    case 'WheelDown':
      next();
      break;
    case 'ArrowUp':
      randomForward();
      break;
    case 'ArrowDown':
      randomBackward();
      break;
    case ' ':
      random();
      break;
    case 'Home':
      first();
      break;
    case 'End':
      last();
      break;
    case 'Backspace':
      historyBack();
      break;
  }
});

$('.json-frame')
  .on('click', '.movie-play', (e) => {
    Rest.Flay.play(flay);
  })
  .on('click', '.flay-view', (e) => {
    View.flay(flay.opus);
  })
  .on('click', '.actress-view', (e) => {
    const actressIndex = $(e.target).closest('.actress-view').attr('data-index');
    View.actress(flay.actressList[actressIndex].name);
  })
  .on('wheel', (e) => {
    // 스크롤 상태이면, 휠 이벤트 전파 중지. 페이지 이동 방지
    const flayInfo = document.querySelector('.json-frame');
    if (flayInfo.scrollHeight > flayInfo.clientHeight) {
      e.stopPropagation();
    }
  })
  .on('click', '.bracket-toggler', (e) => {
    $(e.target).toggleClass('hide');
  })
  .on('click', '.json-expander', (e) => {
    jsonExpanded = e.target.classList.contains('plus');
    jsonExpand();
  });

function jsonExpand() {
  if (jsonExpanded) {
    $('.bracket-toggler').removeClass('hide');
  } else {
    $('.json > .bracket > .bracket > .bracket-toggler').addClass('hide');
  }
}

LocalStorageItem.get('flay.raw.rank', '1,2,3,4,5')
  .split(',')
  .forEach((r) => {
    $('#rank' + r).prop('checked', true);
  });

startGround();

function startGround() {
  const condition = {
    studio: $('#studioInput').val(),
    opus: $('#opusInput').val(),
    title: $('#titleInput').val(),
    actress: $('#actressInput').val(),
    release: $('#releaseInput').val(),
    rank: $.map($('input[name="rank"]:checked'), (element) => Number(element.value)),
    search: $('#searchInput').val(),
    withSubtitles: $('#withSubtitles').prop('checked'),
    withFavorite: $('#withFavorite').prop('checked'),
    withNoFavorite: $('#withNoFavorite').prop('checked'),
    sort: $('#sort').val(),
  };

  LocalStorageItem.set('flay.raw.rank', condition.rank);

  Rest.Flay.listOfOpus(condition, (list) => {
    console.log('opus list length', list.length, condition);
    $('#opus-opt')
      .empty()
      .append(list.map((item) => `<option value="${item}">${item}</option>`));

    opusList = list;
    lastIndex = opusList.length - 1;
    indexHistory = [];
    index = -1;
    previousIndex = -1;

    $('#searchResultDisplay').html(opusList.length + ' Flay');
    if (opusList.length == 0) {
      $('.page-target').css('opacity', 0);
    }
    random();

    Rest.Flay.listOfStudio(condition, (list) => {
      $('#studio-opt')
        .empty()
        .append(list.map((item) => `<option value="${item}">${item}</option>`));
    });
    Rest.Flay.listOfTitle(condition, (list) => {
      $('#title-opt')
        .empty()
        .append(list.map((item) => `<option value="${item}">${item}</option>`));
    });
    Rest.Flay.listOfActress(condition, (list) => {
      $('#actress-opt')
        .empty()
        .append(list.map((item) => `<option value="${item}">${item}</option>`));
    });
    Rest.Flay.listOfRelease(condition, (list) => {
      $('#release-opt')
        .empty()
        .append(list.map((item) => `<option value="${item}">${item}</option>`));
    });
  });
}

function first() {
  index = 0;
  show();
}

function last() {
  index = lastIndex;
  show();
}

function prev() {
  index = Math.max(0, --index);
  show();
}

function next() {
  index = Math.min(++index, lastIndex);
  show();
}

function random() {
  index = Random.getInteger(0, lastIndex);
  show();
}

function randomForward() {
  index = Random.getInteger(index, lastIndex);
  show();
}

function randomBackward() {
  index = Random.getInteger(0, index);
  show();
}

function historyBack() {
  if (indexHistory.length === 0) {
    console.log('history is empty');
    return;
  }
  renderIndexHistoryContainer();
  let lastIndex = indexHistory.pop();
  if (lastIndex === index) {
    historyBack();
    return;
  }
  index = lastIndex;
  show('nohistory');
}

function renderIndexHistoryContainer() {
  $('#indexHistoryContainer')
    .empty()
    .append(indexHistory.map((idx) => `<label>${idx + 1}</label>`));
}

function show(from) {
  const opus = opusList[index];
  if (!opus) {
    console.warn('opus is not valid', index, opus, opusList);
    return;
  }
  if (previousIndex === index) {
    console.warn('same index', index);
    return;
  }

  previousIndex = index;
  if (!from) {
    indexHistory.push(index);
    renderIndexHistoryContainer();
  }
  // console.log(indexHistory, index);

  const BRACKET_TOGGLER = '<i class="bracket-toggler"></i>';
  const BRACKET_S = '<span class="bracket">';
  const BRACKET_E = '</span>';
  const SQUARE_S = '<span class="square-bracket">[</span>';
  const SQUARE_E = '<span class="square-bracket">]</span>';
  const ROUND_S = '<span class="round-bracket">{</span>';
  const ROUND_E = '<span class="round-bracket">}</span>';

  Rest.Flay.getFully(opus, (fullyFlay) => {
    // console.log(fullyFlay);
    flay = fullyFlay;
    let jsonText = JSON.stringify(
      flay,
      function replacer(k, v) {
        // console.log('[' + k + ']: ', v);
        if (v === null || v === '' || v < 1) {
          return undefined;
        }

        switch (k) {
          case 'lastPlay':
          case 'lastAccess':
          case 'lastModified':
            v = DateUtils.format('yyyy-MM-dd HH:mm', v);
            break;
          case 'length':
            v = File.formatSize(v);
            break;
          case 'actressPoint':
          case 'studioPoint':
          case 'candidate':
            return undefined;
        }

        if (typeof v === 'string') {
          if (k === 'lastPlay' || k === 'lastAccess' || k === 'lastModified') {
            v = `<date>${v}</date>`;
          } else if (k === 'length') {
            v = `<length>${v}</length>`;
          } else {
            v = `<string>${v.replace(/\n/gi, '<br>').replace(/\[/gi, 'squareBracketStart').replace(/\]/gi, 'squareBracketEnd')}</string>`;
          }
        } else if (typeof v === 'number') {
          v = `<number>${v}</number>`;
        } else if (typeof v === 'boolean') {
          v = `<boolean>${v}</boolean>`;
        } else if (typeof v === 'object' && v === null) {
          v = `<null>${v}</null>`;
        }

        return v;
      },
      2
    );

    jsonText = jsonText
      .replace(/"/g, '')
      .replace(/\\\\/g, '\\')
      .replace(/\[/g, BRACKET_TOGGLER + BRACKET_S + SQUARE_S)
      .replace(/\]/g, SQUARE_E + BRACKET_E)
      .replace(/\{/g, BRACKET_TOGGLER + BRACKET_S + ROUND_S)
      .replace(/\}/g, ROUND_E + BRACKET_E)
      .replace(/squareBracketStart/g, '[')
      .replace(/squareBracketEnd/g, ']')
      .replace(/movie/, '<span class="movie">movie</span>')
      .replace(/title/, '<span class="title">title</span>')
      .replace(/localName/g, '<span class="localName">localName</span>')
      .substring(BRACKET_TOGGLER.length);

    Rest.Image.blobUrl('/static/cover/' + flay.opus, (imageBlobUrl) => {
      $('.page-target').animate(
        {
          opacity: 0.25,
        },
        200,
        'linear',
        () => {
          $('#flayCover .cover').css({ backgroundImage: `url('${imageBlobUrl}')` });
          $('#flayInfo .json').html(jsonText);
          jsonExpand();

          // insert anker. play, flay view, actress view
          $('<a class="anker movie-play"><i class="fa fa-external-link"></i></a>').insertAfter('.movie');
          $('<a class="anker flay-view"><i class="fa fa-external-link"></i></a>').insertAfter('.title');
          $('.localName').each((index, element) => {
            $(`<a class="anker actress-view" data-index="${index}"><i class="fa fa-external-link"></i></a>`).insertAfter(element);
          });

          // paging
          $('#paginationProgress > div').css({ width: (((index + 1) / (lastIndex + 1)) * 100).toFixed(1) + '%' });

          // show
          $('.page-target').animate({ opacity: 1 }, 300, 'swing');
        }
      );
    });
  });
}
