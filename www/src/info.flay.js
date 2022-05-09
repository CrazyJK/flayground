import $ from 'jquery';
import { reqParam } from './lib/crazy.common.js';
import { ROW_TITLE, ROW_DESC } from './lib/flay.view.card.js';
import { Rest } from './lib/flay.rest.service.js';
import { Util } from './lib/flay.utils.js';
import './css/common.scss';
import './info.flay.scss';

var opus = reqParam.opus;
var flay;
var loadedFlay = false,
  loadedTag = false;
var isArchive = false;

let tagList;

function setFlay(_flay) {
  flay = _flay;
  document.title = flay.opus + ' - ' + document.title;

  $('#containerFlay').appendFlayCard(flay, { archive: isArchive, include: [ROW_TITLE, ROW_DESC] });
  if (isArchive) {
    document.title = flay.opus + ' - Archive Info';
  }
  loadedFlay = true;
  matchTag();
}

function matchTag() {
  if (loadedFlay && loadedTag) {
    $.each(flay.video.tags, function (idx, tag) {
      $(":checkbox[data-tag-id='" + tag.id + "']").prop('checked', true);
    });

    $('#containerTag').hide();

    $('.toggle-tag')
      .css({
        top: $('.flay-card').height() - 30,
      })
      .on('click', function () {
        $('#containerTag').toggle();
        if ($('#containerTag').css('display') === 'none') {
          window.resizeTo($('.flay-card').width() + 16, $('.flay-card').height() + 68);
          $(this).children('.fa').switchClass('fa-angle-double-up', 'fa-angle-double-down');
        } else {
          window.resizeTo($('.flay-card').width() + 16, $('.flay-card').height() + $('#containerTag').height() + 88);
          $(this).children('.fa').switchClass('fa-angle-double-down', 'fa-angle-double-up');
        }
      });

    window.resizeTo($('.flay-card').width() + 16, $('.flay-card').height() + 68);
  }
}

Rest.Flay.get(
  opus,
  function (f) {
    setFlay(f);
  },
  function () {
    Rest.Archive.get(opus, function (f) {
      isArchive = true;
      setFlay(f);
    });
  }
);

Rest.Tag.list(function (list) {
  tagList = list;
  Util.Tag.sort(tagList);

  $.each(tagList, function (idx, tag) {
    $('<label>', { class: 'check sm' })
      .append(
        $('<input>', { type: 'checkbox', 'data-tag-id': tag.id })
          .data('tag', tag)
          .on('change', function () {
            var checked = $(this).prop('checked');
            var tag = $(this).data('tag');
            console.log('tag toggle', checked, tag, flay);
            if (checked) {
              Util.Tag.push(flay.video.tags, tag);
            } else {
              Util.Tag.remove(flay.video.tags, tag);
            }
            Rest.Video.update(flay.video);
          }),
        $('<span>', { title: tag.description }).html(tag.name)
      )
      .appendTo($('#containerTag'));
  });

  loadedTag = true;
  matchTag();
});
