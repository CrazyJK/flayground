import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';

import './components/RankSelect';
import { reqParam, ThreadUtils } from './lib/crazy.common.js';
import './lib/crazy.jquery';
import { Rest } from './lib/flay.rest.service.js';
import { ACTRESS_EXTRA, COMMENT, FILEINFO, MODIFIED, RANK, STUDIO } from './lib/flay.view.card.js';
import './lib/flay.websocket.js';

import './info.studio.scss';
import './styles/common.scss';

const studioName = reqParam.s;
const $flayList = $('.flay-list');

Rest.Studio.get(
  studioName,
  (studio) => {
    document.title = studio.name + ' - ' + document.title;
    $('#name').val(studio.name);
    $('#company').val(studio.company);
    $('#homepage').val(studio.homepage);
  },
  () => {
    document.title = studioName + ' - Notfound';
    $('#name').val(studioName);
  }
);

Rest.Flay.find('studio/' + studioName, (flayList) => {
  flayList.sort((flay1, flay2) => {
    const c = flay2.release.toLowerCase().localeCompare(flay1.release);
    return c === 0 ? flay2.opus.toLowerCase().localeCompare(flay1.opus) : c;
  });

  displayFlayList(flayList).then(() => {
    console.log('completed load');
    $('#filter-rank').css({ opacity: 1 });
  });
});

async function displayFlayList(flayList) {
  $('.video-count').html(flayList.length);
  $flayList.empty();

  let count = 0;
  for (const flay of flayList) {
    $flayList.appendFlayCard(flay, {
      width: 330,
      exclude: [STUDIO, ACTRESS_EXTRA, MODIFIED, RANK, COMMENT, FILEINFO],
      fontSize: '80%',
      class: flay.video.rank === 0 ? 'unrank' : 'r' + flay.video.rank,
    });
    $('.video-count').html(++count + '/' + flayList.length);

    await ThreadUtils.sleep(82);
  }
}

$('#save').on('click', () => {
  Rest.Studio.update(
    {
      name: $('#name').val().trim(),
      company: $('#company').val().trim(),
      homepage: $('#homepage').val().trim(),
    },
    () => {
      $('#save').html('Updated');
      setTimeout(() => {
        $('#save').html('Save');
      }, 1000);
    }
  );
});

$('rank-select').on('change', (e) => {
  console.log(e.detail.rank);
  if (e.detail.rank.length > 0) {
    $('.flay-card').hide();
    e.detail.rank.forEach((r) => {
      $('.flay-card.r' + r).show();
    });
  } else {
    $('.flay-card').show();
  }
});
