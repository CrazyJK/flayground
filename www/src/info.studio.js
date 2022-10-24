import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import './css/common.scss';
import './lib/crazy.jquery';
import './lib/flay.websocket.js';

import { reqParam, ThreadUtils } from './lib/crazy.common.js';
import { Rest } from './lib/flay.rest.service.js';
import { ACTRESS_EXTRA, COMMENT, FILEINFO, MODIFIED, RANK, STUDIO } from './lib/flay.view.card.js';

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
    });
    $('.video-count').html(++count);

    await ThreadUtils.sleep(500);
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
