import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import './components/RankSelect';
import './info.tag.scss';
import './lib/crazy.jquery';
import './lib/flay.websocket.js';
import './styles/common.scss';

import { reqParam, ThreadUtils } from './lib/crazy.common.js';
import { loading } from './lib/flay.loading.js';
import { Rest } from './lib/flay.rest.service.js';
import { Util } from './lib/flay.utils.js';
import { ACTRESS, COMMENT, FILEINFO, MODIFIED, RANK } from './lib/flay.view.card.js';

const id = reqParam.id;
let tag;

$('#save').on('click', function () {
  tag.name = $('#name').val();
  tag.description = $('#description').val();
  Rest.Tag.update(tag, function () {
    const loadingIndex = loading.on('Updated');
    setTimeout(() => {
      loading.off(loadingIndex);
    }, 3 * 1000);
  });
});

$('#marked').on('click', function () {
  const isChecked = $(this).prop('checked');
  const rankValues = $('rank-select').attr('data-value');
  const ranks = rankValues ? rankValues.split(',') : [];
  toggleFlayCard(ranks, isChecked);
});

$('rank-select').on('change', (e) => {
  const isChecked = $('#marked').prop('checked');
  toggleFlayCard(e.detail.rank, isChecked);
});

function toggleFlayCard(ranks, marked) {
  // console.log('toggleFlayCard', ranks, marked);
  $('.flay-card').hide();
  if (ranks.length > 0) {
    ranks.forEach((r) => {
      $('.flay-card' + (marked ? '.tag-mark' : '') + '.r' + r).show();
    });
  } else {
    $('.flay-card' + (marked ? '.tag-mark' : '')).show();
  }
}

Rest.Tag.get(id, function (_tag) {
  tag = _tag;
  document.title = tag.name + ' - ' + document.title;

  $('#name').val(tag.name);
  $('#description').val(tag.description);

  Rest.Flay.findByTagLike(tag, async function (flayList) {
    flayList.sort(function (flay1, flay2) {
      return flay2.release.toLowerCase().localeCompare(flay1.release);
    });

    var $flayList = $('.flay-list').empty();
    var tagMarkedCount = 0;

    for (let flay of flayList) {
      var isTagMarked = Util.Tag.includes(flay.video.tags, tag);
      if (isTagMarked) tagMarkedCount++;

      $flayList.appendFlayCard(flay, {
        width: 330,
        exclude: [ACTRESS, MODIFIED, RANK, COMMENT, FILEINFO],
        fontSize: '80%',
        class: (isTagMarked ? 'tag-mark' : 'tag-unmark') + ' r' + flay.video.rank,
      });
      $('.video-count').html(tagMarkedCount + ' / ' + flayList.length);

      await ThreadUtils.sleep(82);
    }

    $('#filter-rank').css({ opacity: 1 });
  });
});
