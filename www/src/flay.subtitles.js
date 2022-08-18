/**
 * subtitles js
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'bootstrap/dist/js/bootstrap';
import './lib/crazy.jquery';
import './components/FlayMenu';
import './css/common.scss';
import './flay.subtitles.scss';

import { Rest, restCall } from './lib/flay.rest.service.js';
import { Search, View } from './lib/flay.utils.js';

let noSubtitlesOpusList = [];
let intervalFindSubtitles = -1;
let foundSubtitlesCount = 0;
let currentFindingIndex = 0;
let flayList = [];

Rest.Flay.list((list) => {
  flayList = list;
});

restCall('/file/find/exists/subtitles/config', { method: 'patch' }, (config) => {
  console.log('get config', config);
  $('#useTorProxy').prop('checked', config.useTorProxy);
  $('#jsoupTimeout').val(config.jsoupTimeout);
});

$('#useTorProxy, #jsoupTimeout').on('change', () => {
  const param = `useTorProxy=${$('#useTorProxy').prop('checked')}&jsoupTimeout=${$('#jsoupTimeout').val()}`;
  restCall('/file/find/exists/subtitles/config?' + param, { method: 'patch' }, (config) => {
    console.log('set config', config);
    $('#useTorProxy').prop('checked', config.useTorProxy);
    $('#jsoupTimeout').val(config.jsoupTimeout);
  });
});

const processStart = () => {
  const findSubtitles = () => {
    ++currentFindingIndex;
    const opus = noSubtitlesOpusList.shift();
    const $sub = $('#' + opus + ' > .flay-subtitles').html('finding...'); // mark current active
    Search.subtitlesUrlIfFound(opus, (result) => {
      if (result.error === '') {
        if (result.url.length > 0) {
          // counting found subtitles
          foundSubtitlesCount++;
          $('#foundSubtitlesCount').html(foundSubtitlesCount); // mark found count

          $sub.empty().closest('.flay-item').addClass('found-subtitles');
          // add found link
          for (const url of result.url) {
            $sub.append(
              $(`<a href="${url}"></a>`)
                .on('click', (e) => {
                  $(e.target).remove();
                })
                .append('<i class="fa fa-external-link mx-1"></i>')
            );
          }
        } else {
          // not found
          $sub.html(`<span class="text-secondary">not found</span>`);
        }
      } else {
        // error
        $sub.html(`<span class="text-danger">${result.error}</span>`);
      }
    });
    // scroll move
    const itemPerPage = Math.round($(window).height() / 28);
    if (currentFindingIndex > itemPerPage && currentFindingIndex % itemPerPage === 1) {
      let offsetTop = document.getElementById(opus).offsetTop;
      $('#flayList').animate({ scrollTop: offsetTop - 60 }, 500);
      console.log('itemPerPage', itemPerPage, 'currentFindingIndex', currentFindingIndex, `${opus} offsetTop`, offsetTop);
    }
  };

  // initiate
  $('#btnStopFinding').show();
  $('#btnFindSubtitles, #btnFilterFound').hide();
  $('#foundSubtitlesCount').html('0');
  intervalFindSubtitles = -1;
  foundSubtitlesCount = 0;

  // first call
  // findSubtitles();

  // interval call
  intervalFindSubtitles = setInterval(() => {
    findSubtitles();
    if (noSubtitlesOpusList.length === 0) {
      processStop();
    }
  }, 500);
};

const processStop = () => {
  clearInterval(intervalFindSubtitles);
  if (noSubtitlesOpusList.length === 0) {
    $('#btnFindSubtitles, #btnStopFinding').hide();
  } else {
    $('#btnFindSubtitles').html('Resume');
  }
  $('#btnStopFinding').hide();
  $('#btnFindSubtitles, #btnFilterFound').show();
};

const displayList = (e) => {
  // filter rank
  const selectedRank = [];
  $("input:checkbox[name='rank']:checked").each((index, rank) => {
    selectedRank.push(Number(rank.value));
  });

  // initiate
  $('#btnFindSubtitles').show().html('Find');
  $('#btnStopFinding').hide();
  $('#btnFilterFound').hide();
  $('#flayList').empty();
  noSubtitlesOpusList = [];
  currentFindingIndex = 0;

  // sorting by release
  flayList
    .filter((flay) => {
      return flay.files.subtitles.length === 0 && selectedRank.includes(flay.video.rank);
    })
    .sort((a, b) => {
      const c1 = b.video.rank - a.video.rank;
      return c1 === 0 ? b.release.localeCompare(a.release) : c1;
    })
    .forEach((flay, count) => {
      noSubtitlesOpusList.push(flay.opus);

      $('#flayList').append(
        `<div class="flay-item" id="${flay.opus}" rank="${flay.video.rank}">
          <label class="flay-count">${++count}</label>
          <label class="flay-studio">${flay.studio}</label>
          <label class="flay-opus">${flay.opus}</label>
          <label class="flay-title hover"">${flay.title}</label>
          <label class="flay-actressList">${flay.actressList}</label>
          <label class="flay-release">${flay.release}</label>
          <label class="flay-rank">${flay.video.rank > 0 ? flay.video.rank : ''}</label>
          <label class="flay-tag">${ifTag(flay, 90)}</label>
          <label class="flay-subtitles"></label>
        </div>`
      );
    });

  $('.flay-title').on('click', (e) => {
    const opus = $(e.target).closest('.flay-item').attr('id');
    View.flay(opus);
  });

  $('#flayCount').html(noSubtitlesOpusList.length); // mark total count
};

const ifTag = (flay, tagId) => {
  if (flay.video.tags.length > 0) {
    for (const tag of flay.video.tags) {
      if (tag.id === tagId) {
        return tag.name;
      }
    }
  }
  return '';
};

// start find
$('#btnFindSubtitles').on('click', processStart);

// stop find
$('#btnStopFinding').on('click', processStop);

// filter found subtitles
$('#btnFilterFound').on('click', () => {
  $('.flay-item:not(.found-subtitles)').toggle();
});

// click subtiles link
$('#flayList').on('click', '.flay-subtitles > a', (e) => {
  $(e.target).closest('.flay-item').addClass('active-subtitles');
});

$("input:checkbox[name='rank']").on('change', displayList).trigger('change');
