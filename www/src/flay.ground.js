/**
 * flay ground
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'bootstrap/dist/js/bootstrap';
import './components/FlayMenu';
import './components/RankSelect';
import './css/common.scss';
import './flay.ground.scss';

import { Rest } from './lib/flay.rest.service';
import { DateUtils, File, Random } from './lib/crazy.common';
import { View } from './lib/flay.utils.js';

Rest.Flay.list((list) => {
  list.sort((f1, f2) => f1.release.localeCompare(f2.release));

  const LAST_INDEX = list.length - 1;
  let index = -1;

  function first() {
    index = 0;
    show();
  }
  function last() {
    index = LAST_INDEX;
    show();
  }
  function prev() {
    index = Math.max(0, --index);
    show();
  }
  function next() {
    index = Math.min(++index, LAST_INDEX);
    show();
  }
  function random() {
    index = Random.getInteger(0, LAST_INDEX);
    show();
  }
  function randomForward() {
    index = Random.getInteger(index, LAST_INDEX);
    show();
  }
  function randomBackward() {
    index = Random.getInteger(0, index);
    show();
  }
  function show() {
    const flay = list[index];
    // console.log('show', index, flay);
    if (flay.actressList.length > 0) {
      if (typeof flay.actressList[0] === 'string') {
        flay.actressList = flay.actressList.map((name) => Rest.Actress.getSync(name));
      }
    }
    if (flay.score === 0) {
      flay.score = Rest.Flay.getScoreSync(flay.opus);
    }

    const jsonText = JSON.stringify(
      flay,
      function replacer(k, v) {
        // console.log('k', typeof k, k, 'v', typeof v, v);
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

    $('#flayContainer').animate(
      {
        opacity: 0,
      },
      300,
      'linear',
      () => {
        $('#flayCover').attr('src', '/static/cover/' + flay.opus);
        $('#flayInfo').html(jsonText);
        // paging
        $('#paginationProgress > div').css({ width: (((index + 1) / (LAST_INDEX + 1)) * 100).toFixed(1) + '%' });
        // insert anker. play, flay view, actress view
        $('<a class="anker movie-play"><i class="fa fa-external-link"></i></a>').insertAfter('.movie');
        $('<a class="anker flay-view"><i class="fa fa-external-link"></i></a>').insertAfter('.title');
        $('.localName').each((index, element) => {
          $(`<a class="anker actress-view" data-index="${index}"><i class="fa fa-external-link"></i></a>`).insertAfter(element);
        });
        // show
        $('#flayContainer').animate({ opacity: 1 }, 300, 'swing');
      }
    );
  }
  function eventHandler(e) {
    // console.log('[eventHandler]', e.type);
    switch (e.key || (e.originalEvent.deltaY < 0 ? 'WheelUp' : 'WheelDown')) {
      case 'ArrowLeft':
      case 'WheelUp':
      case '4':
        prev();
        break;
      case 'ArrowRight':
      case 'WheelDown':
      case '6':
        next();
        break;
      case 'ArrowUp':
      case '8':
        randomForward();
        break;
      case 'ArrowDown':
      case '2':
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
    }
  }

  $(window).on('keyup wheel', eventHandler);

  $('#flayInfo')
    .on('click', '.movie-play', (e) => {
      Rest.Flay.play(list[index]);
    })
    .on('click', '.flay-view', (e) => {
      View.flay(list[index].opus);
    })
    .on('click', '.actress-view', (e) => {
      const actressIndex = $(e.target).closest('.actress-view').attr('data-index');
      View.actress(list[index].actressList[actressIndex].name);
    })
    .on('wheel', (e) => {
      // 스크롤 상태이면, 휠 이벤트 전파 중지. 페이지 이동 방지
      const flayInfo = document.getElementById('flayInfo');
      // console.log('flayInfo wheel', flayInfo, flayInfo.scrollHeight, flayInfo.clientHeight);
      if (flayInfo.scrollHeight > flayInfo.clientHeight) {
        e.stopPropagation();
      }
    });

  random();
});
