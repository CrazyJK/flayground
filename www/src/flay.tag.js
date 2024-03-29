/**
 * tag list
 */

import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';

import './components/FlayMenu';
import { ThreadUtils } from './lib/crazy.common';
import './lib/crazy.jquery';
import { Rest } from './lib/flay.rest.service';
import { Util, View } from './lib/flay.utils';

import './flay.tag.scss';
import './styles/common.scss';

const $tagTemplete = $('.tag');
let isLikeSearchChecked = false;

$('form').on('submit', (e) => {
  e.preventDefault();
});

$('.tag-save').on('click', function () {
  const tag = {};
  $.each($('#tagInput').serializeArray(), function () {
    tag[this.name] = this.value;
  });

  if (tag.id === '') {
    Rest.Tag.create(tag, tagLoad);
  } else {
    Rest.Tag.update(tag, tagLoad);
  }
});

$('.tag-delete').on('click', () => {
  const tag = $('#tagInput').data('tag');
  if (tag && tag.id && confirm('Delete this tag?\n' + JSON.stringify(tag))) {
    Rest.Tag.delete(tag, () => {
      tagLoad();
      $('#tagId, #tagName, #tagDesc').val('');
    });
  }
});

$('#likeSearch').on('click', function () {
  isLikeSearchChecked = $(this).prop('checked');
  $('#likeSearchText').html(isLikeSearchChecked ? 'Like' : 'marked');
  tagLoad();
});

function tagLoad() {
  Rest.Tag.list(async (tagList) => {
    const $tagList = $('#tagList').empty();
    let tagTotal = tagList.length;
    let flayTotal = 0;

    Util.Tag.sort(tagList);

    for (let tag of tagList) {
      const $tagCard = $tagTemplete.clone();
      $tagCard.appendTo($tagList);
      $tagCard.data('tag', tag).attr('id', 'tag-' + tag.id);
      $tagCard
        .find('.tag-name')
        .html(tag.name)
        .on('click', (e) => {
          $('#tagInput').data('tag', tag);
          $('#tagId').val(tag.id);
          $('#tagName').val(tag.name);
          $('#tagDesc').val(tag.description);

          $('#tagList > .tag').removeClass('active');
          $(e.target).closest('.tag').addClass('active');
        });
      $tagCard.find('.tag-desc').html(tag.description);
      $tagCard.find('.tag-open').on('click', () => {
        View.tag(tag.id);
      });
    }

    for (let tag of tagList) {
      const $tagCard = $('#tag-' + tag.id);
      const findByTagCallback = (flayList) => {
        $tagCard.data('flayList', flayList);
        $tagCard
          .find('.flay-count')
          .html(flayList.length)
          .addClass(flayList.length > 0 ? '' : 'flay-count-no');
        $tagCard.find('.tag-name').css({
          fontSize: flayList.length * 0.125 + 16,
        });
        flayTotal += flayList.length;
        $('#summary').html(tagTotal + ' Tag, ' + flayTotal + ' Flay');
      };

      if (isLikeSearchChecked) {
        Rest.Flay.findByTagLike(tag, findByTagCallback);
      } else {
        Rest.Flay.findByTag(tag, findByTagCallback);
      }
      await ThreadUtils.sleep(69);
    }
  });
}

tagLoad();
