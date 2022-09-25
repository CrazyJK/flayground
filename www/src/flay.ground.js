/**
 * flay ground
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'bootstrap/dist/js/bootstrap';
import './components/FlayMenu';
import './css/common.scss';
import './flay.ground.scss';

import { Rest } from './lib/flay.rest.service';
import { DateUtils, File, Random } from './lib/crazy.common';
import { View } from './lib/flay.utils.js';

let opusList = [];
let indexHistory = [];
let index = -1;
let lastIndex = -1;
let previousIndex = -1;
let flay;

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
  });

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

  Rest.Flay.getFully(opus, (_flay) => {
    // console.log(_flay);
    flay = _flay;
    const jsonText = JSON.stringify(
      flay,
      function replacer(k, v) {
        // console.log('k[' + typeof k + ']', k, 'v[' + typeof v + ']', v);
        if (k === 'lastAccess') {
          v = DateUtils.format('yyyy-MM-dd HH:mm:ss', v);
        } else if (k === 'lastModified') {
          v = DateUtils.format('yyyy-MM-dd HH:mm:ss', v);
        } else if (k === 'length') {
          v = File.formatSize(v);
        } else if (k === 'actressPoint' || k === 'studioPoint' || k === 'candidate') {
          return undefined;
        }

        if (typeof v === 'string') {
          v = `<string>'${v.replace(/\n/gi, '<br>').replace(/\[/gi, 'bracketStart').replace(/\]/gi, 'bracketEnd')}'</string>`;
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
    )
      .replace(/"/g, '')
      .replace(/'/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\[/g, '<span class="square-bracket">[</span>')
      .replace(/\]/g, '<span class="square-bracket">]</span>')
      .replace(/\{/g, '<span class="round-bracket">{</span>')
      .replace(/\}/g, '<span class="round-bracket">}</span>')
      .replace(/bracketStart/g, '[')
      .replace(/bracketEnd/g, ']')
      .replace(/movie/, '<span class="movie">movie</span>')
      .replace(/title/, '<span class="title">title</span>')
      .replace(/localName/g, '<span class="localName">localName</span>');

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
