/**
 * subtitles js
 */

import $ from 'jquery';
import { Rest, restCall } from './lib/flay.rest.service.js';
import { Search } from './lib/flay.utils.js';
import './flay.subtitles.scss';

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
    const opus = noSubtitlesOpusList[currentFindingIndex++];
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
      // location.href = "#" + opus;
      $('html, body').animate({ scrollTop: $('#' + opus).position().top - 60 }, 500);
    }
  };

  // initiate
  $('#btnStopFinding').show();
  $('#btnFindSubtitles, #btnFilterFound').hide();
  $('#foundSubtitlesCount').html('0');
  intervalFindSubtitles = -1;
  foundSubtitlesCount = 0;

  // first call
  findSubtitles();

  // interval call
  intervalFindSubtitles = setInterval(() => {
    findSubtitles();
    if (noSubtitlesOpusList.length === currentFindingIndex) {
      processStop();
    }
  }, 500);
};

const processStop = () => {
  clearInterval(intervalFindSubtitles);
  if (noSubtitlesOpusList.length === currentFindingIndex) {
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

      const html = `<div class="flay-item" id="${flay.opus}" rank="${flay.video.rank}">
								<label class="flay-count">${++count}</label>
								<label class="flay-studio">${flay.studio}</label>
								<label class="flay-opus">${flay.opus}</label>
								<label class="flay-title hover" onclick="View.flay('${flay.opus}')">${flay.title}</label>
								<label class="flay-actressList">${flay.actressList}</label>
								<label class="flay-release">${flay.release}</label>
								<label class="flay-rank">${flay.video.rank > 0 ? flay.video.rank : ''}</label>
								<label class="flay-tag">${ifTag(flay, 90)}</label>
								<label class="flay-subtitles"></label>
							</div>`;

      $('#flayList').append(html);
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
