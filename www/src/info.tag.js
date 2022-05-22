import $ from 'jquery';
import { reqParam } from './lib/crazy.common.js';
import { Rest } from './lib/flay.rest.service.js';
import { loading } from './lib/flay.loading.js';
import { Util } from './lib/flay.utils.js';
import { ACTRESS, MODIFIED, RANK, COMMENT, FILEINFO } from './lib/flay.view.card.js';
import flayWebsocket from './lib/flay.websocket.js';
import './css/common.scss';
import './info.tag.scss';

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
  var isChecked = $(this).prop('checked');
  $('.tag-unmark').toggle(!isChecked);
});

Rest.Tag.get(id, function (_tag) {
  tag = _tag;
  document.title = tag.name + ' - ' + document.title;

  $('#name').val(tag.name);
  $('#description').val(tag.description);

  Rest.Flay.findByTagLike(tag, function (flayList) {
    flayList.sort(function (flay1, flay2) {
      return flay2.release.toLowerCase().localeCompare(flay1.release);
    });

    var $flayList = $('.flay-list').empty();
    var tagMarkedCount = 0;

    $.each(flayList, function (idx, flay) {
      var isTagMarked = Util.Tag.includes(flay.video.tags, tag);
      if (isTagMarked) tagMarkedCount++;

      $flayList.appendFlayCard(flay, {
        width: 330,
        exclude: [ACTRESS, MODIFIED, RANK, COMMENT, FILEINFO],
        fontSize: '80%',
        class: isTagMarked ? 'tag-mark' : 'tag-unmark',
      });
    });

    $('.video-count').html(tagMarkedCount + ' / ' + flayList.length);
  });
});
