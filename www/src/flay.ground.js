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

const $resultContainer = $('.result');

let keyword;

document.querySelector('#query').addEventListener('change', (e) => {
  keyword = StringUtils.trim(e.target.value);
  if (keyword.length > 1) {
    Rest.Flay.findAll(keyword, displayResult);
  } else if (keyword.length === 0) {
    displayResult([]);
  }
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

async function displayResult(list) {
  function matchKeyword(string) {
    return string.replace(regExp, (match) => {
      return '<span class="keyword">' + match + '</span>';
    });
  }
  const regExp = new RegExp(keyword, 'i');
  $resultContainer.empty();
  $('main').toggleClass('exists', list.length > 0);
  let count = 0;
  for (const flay of list) {
    $resultContainer.append(`
      <div class="flay">
        <img class="flay-cover" src="/static/cover/${flay.opus}" />
        <dl>
          <dt>
            <img class="flay-rank" src="./img/svg/rank/star-rank-${flay.archive ? 'a' : flay.video.rank}.svg" />
            <label class="flay-title" data-opus="${flay.opus}">
              ${matchKeyword(flay.title)}
            </label>
          </dt>
          <dd>
            <label class="flay-studio">${matchKeyword(flay.studio)}</label>
            <label class="flay-opus">${matchKeyword(flay.opus)}</label>
            <label class="flay-release">${matchKeyword(flay.release)}</label>
            ${Array.from(flay.actressList)
              .map((actress) => {
                return `<label class="flay-actress">${matchKeyword(actress)}</label>`;
              })
              .join('')}
          </dd>
          <dd>
            ${StringUtils.isBlank(flay.video.comment) ? '' : '<label>[' + matchKeyword(flay.video.comment) + ']</label>'}
            ${Array.from(flay.video.tags)
              .map((tag) => {
                return `<label class="flay-tag" data-id="${tag.id}">${matchKeyword(tag.name)}</label>`;
              })
              .join('')}
          </dd>
        </dl>
      </div>
    `);
    $('.search-result').html(++count + '/' + list.length + ' f');

    await ThreadUtils.sleep(100);
  }
  $('.search-result').html(list.length + ' f');
}
