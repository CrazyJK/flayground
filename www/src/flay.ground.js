/**
 * flay ground
 */

import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import './components/FlayMenu';
import './css/common.scss';
import './flay.ground.scss';

import { StringUtils, ThreadUtils } from './lib/crazy.common';
import { Rest } from './lib/flay.rest.service.js';
import { View } from './lib/flay.utils.js';
import { BASKET, ROW_DESC, ROW_TITLE, SEARCH } from './lib/flay.view.card.js';

const $resultContainer = $('.result');
const heightOfRecoed = 115;
const studioMap = new Map();
const actressMap = new Map();

let pageSize = Math.round(window.innerHeight / heightOfRecoed);
let keyword;

window.addEventListener('resize', (e) => {
  pageSize = Math.round(window.innerHeight / heightOfRecoed);
  $(document).trigger('scroll');
});

$(document).on('scroll', function () {
  const scrollTop = $(this).scrollTop();
  const innerHeight = $(this).innerHeight();
  if (innerHeight - scrollTop - window.innerHeight < 1) {
    $('.flay-next').trigger('click').remove();
  }
});

$('#query').on('keyup', (e) => {
  if (e.key !== 'Enter') {
    return;
  }
  keyword = StringUtils.trim(e.target.value);
  if (keyword.length > 1) {
    Rest.Archive.page(0, pageSize, keyword, displayResult);
  } else if (keyword.length === 0) {
    displayResult({ content: [], number: 0, totalElements: 0, empty: true });
  }
});
$('.search-magnify').on('click', (e) => {
  keyword = 'RANDOM';
  Rest.Flay.page(0, pageSize, keyword, displayRandom);
});

$resultContainer
  .on('click', '.flay-studio', function (e) {
    View.studio(this.innerText);
  })
  .on('click', '.flay-opus', function (e) {
    View.video(this.innerText);
  })
  .on('click', '.flay-title', function (e) {
    View.flay($(this).attr('data-opus'));
  })
  .on('click', '.flay-actress', function (e) {
    View.actress(this.innerText);
  })
  .on('click', '.flay-tag', function (e) {
    View.tag($(this).attr('data-id'));
  });

async function displayResult(page) {
  function matchKeyword(string) {
    return string.replace(regExp, (match) => {
      return '<span class="keyword">' + match + '</span>';
    });
  }
  const regExp = new RegExp(keyword, 'i');

  $('main').toggleClass('exists', !page.empty);
  $('.search-result').html(page.totalElements + ' f');
  $('.summary-studio').html('');
  $('.summary-actress').html('');

  if (page.number === 0) {
    $resultContainer.empty();
    studioMap.clear();
    actressMap.clear();
  }

  let count = page.number * page.size;
  for (const flay of page.content) {
    if (studioMap.has(flay.studio)) {
      let count = studioMap.get(flay.studio);
      studioMap.set(flay.studio, ++count);
    } else {
      studioMap.set(flay.studio, 1);
    }
    for (const actressName of flay.actressList) {
      if (actressMap.has(actressName)) {
        let count = actressMap.get(actressName);
        actressMap.set(actressName, ++count);
      } else {
        actressMap.set(actressName, 1);
      }
    }

    $resultContainer.append(`
      <div class="flay">
        <img class="flay-cover" src="/static/cover/${flay.opus}" />
        <dl>
          <dt>
            <img class="flay-rank" src="./img/svg/rank/star-rank-${flay.archive ? 'a' : flay.video.rank}.svg" />
            <label class="flay-title hover" data-opus="${flay.opus}">
              ${matchKeyword(flay.title)}
            </label>
          </dt>
          <dd>
            <label class="flay-studio hover">${matchKeyword(flay.studio)}</label>
            <label class="flay-opus hover">${matchKeyword(flay.opus)}</label>
            <label class="flay-release">${matchKeyword(flay.release)}</label>
            ${Array.from(flay.actressList)
              .map((actress) => {
                return `<label class="flay-actress hover">${matchKeyword(actress)}</label>`;
              })
              .join('')}
          </dd>
          <dd>
            ${StringUtils.isBlank(flay.video.comment) ? '' : '<label>[' + matchKeyword(flay.video.comment) + ']</label>'}
            ${Array.from(flay.video.tags)
              .map((tag) => {
                return `<label class="flay-tag hover" data-id="${tag.id}">${matchKeyword(tag.name)}</label>`;
              })
              .join('')}
          </dd>
        </dl>
      </div>
    `);

    $('.search-result').html((++count === page.totalElements ? '' : '<small>' + count + '/</small>') + page.totalElements + ' f');

    let studioSummaryHtml = '';
    for (const [k, v] of studioMap) {
      studioSummaryHtml += `<span>${k} (${v})</span>`;
    }
    $('.summary-studio').html(studioSummaryHtml);

    let actressSummaryHtml = '';
    for (const [k, v] of actressMap) {
      actressSummaryHtml += `<span>${k} (${v})</span>`;
    }
    $('.summary-actress').html(actressSummaryHtml);

    await ThreadUtils.sleep(100);
  }

  if (!page.last) {
    $(`<div class="flay-next"></div>`)
      .on('click', () => {
        Rest.Archive.page(page.number + 1, page.size, keyword, displayResult);
      })
      .appendTo($resultContainer);
  }
}

function displayRandom(page) {
  if (page.empty) {
    return;
  }

  $('.search-result, .summary-studio, .summary-actress').html('');
  $resultContainer.empty().appendFlayCard(page.content[0], {
    exclude: [BASKET, ROW_TITLE, ROW_DESC, SEARCH],
  });
}
