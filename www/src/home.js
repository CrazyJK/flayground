/**
 * flay home
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'bootstrap/dist/js/bootstrap';
import './lib/crazy.jquery';
import './lib/FlayMenu';
import './css/common.scss';
import './home.scss';

import { Rest } from './lib/flay.rest.service.js';
import { Util, View } from './lib/flay.utils.js';

let flayList = [];
let actressList = [];
let tagList = [];

Promise.all([
  new Promise((resolve, reject) => {
    Rest.Flay.list(resolve);
  }),
  new Promise((resolve, reject) => {
    Rest.Actress.list(resolve);
  }),
  new Promise((resolve, reject) => {
    Rest.Tag.list(resolve);
  }),
]).then((results) => {
  [flayList, actressList, tagList] = results;

  attachEventListener();
  initiate();
});

function attachEventListener() {
  // rank filter
  $('#filter-rank input').on('change', (e) => {
    $('.rank-' + $(e.target).val()).toggleClass('selected', $(e.target).prop('checked'));
    $('.find-input').trigger('keyup', ['manual']);
  });

  // find
  $('#find-title, #find-actress, #find-tag').on('keyup', (e, isManual) => {
    e.stopPropagation();
    if (e.key === 'Enter' || isManual) {
      $('#opusList label').removeClass('found');
      const findTitle = $('#find-title').val().trim();
      const findActress = $('#find-actress').val().trim();
      const findTag = $('#find-tag').val().trim();
      if (findTitle === '' && findActress === '' && findTag === '') {
        return;
      }
      $('.selected').each((idx, label) => {
        const foundTitle = findTitle === '' || (findTitle !== '' && $(label).attr('data-title').includes(findTitle));
        const foundActress = findActress === '' || (findActress !== '' && $(label).attr('data-actress').includes(findActress));
        const foundTag = findTag === '' || (findTag !== '' && $(label).attr('data-tag').includes(findTag));
        if (foundTitle && foundActress && foundTag) {
          $(label).addClass('found');
        }
      });
    }
  });

  // key event
  $(window).on('keyup', (e) => {
    if ('012345'.includes(e.key)) {
      $('#rank' + e.key).click();
    }
  });
}

function initiate() {
  // render Opus List;
  Util.Flay.sort(flayList, 'R');
  $('#opusList').append(
    flayList.map((flay) => {
      const title = flay.title;
      const actress = flay.actressList.join(',');
      const tag = flay.video.tags.map((tag) => tag.name).join(',');
      const opus = flay.opus.slice(-7, flay.opus.length);
      return $(`<label class="rank-${flay.video.rank}" data-actress="${actress}" data-tag="${tag}" data-title="${title}">${opus}</label>`).on('click', (e) => {
        View.flay(flay.opus);
        $(e.target).addClass('opened');
      });
    })
  );

  // render Actress List;
  const actressNameSet = new Set();
  flayList.forEach((flay) => {
    flay.actressList.forEach((name) => {
      actressNameSet.add(name);
    });
  });
  actressNameSet.forEach((name) => {
    const actress = findActress(name);
    $('#actress-opt').append(`<option value="${actress.name}">${actress.favorite ? '♥' : '♡'} ${actress.localName} ${Util.Actress.getAge(actress)}y</option>`);
  });

  // render Tag List;
  $('#tag-opt').append(tagList.map((tag) => `<option value="${tag.name}">${tag.description}</option>`));
}

function findActress(name) {
  for (const actress of actressList) {
    if (actress.name === name) {
      return actress;
    }
  }
  throw new Error('Not found actress ' + name);
}
