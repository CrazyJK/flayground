import $ from 'jquery';
import { Rest } from './lib/flay.rest.service';
import { Util, View } from './lib/flay.utils';
import './flay.tag.scss';

var $tagTemplete = $('.tag');
var isLikeSearchChecked = false;

$('form').on('submit', function (e) {
  e.preventDefault();
});

$('.tag-save').on('click', function () {
  var tag = {};
  $.each($('#tagInput').serializeArray(), function () {
    tag[this.name] = this.value;
  });

  if (tag.id === '') {
    Rest.Tag.create(tag, tagLoad);
  } else {
    Rest.Tag.update(tag, tagLoad);
  }
});

$('.tag-delete').on('click', function () {
  var tag = $('#tagInput').data('tag');
  if (tag && tag.id && confirm('Delete this tag?\n' + JSON.stringify(tag))) {
    Rest.Tag.delete(tag, function () {
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
  var $tagList = $('#tagList');
  let tagTotal = 0;
  let flayTotal = 0;

  Rest.Tag.list(function (tagList) {
    tagTotal = tagList.length;
    Util.Tag.sort(tagList);
    $tagList.empty();

    $.each(tagList, function (idx, tag) {
      var $tagCard = $tagTemplete.clone();
      $tagCard.data('tag', tag);
      $tagCard
        .find('.tag-name')
        .html(tag.name)
        .on('click', function () {
          $('#tagInput').data('tag', tag);
          $('#tagId').val(tag.id);
          $('#tagName').val(tag.name);
          $('#tagDesc').val(tag.description);

          $('#tagList > .tag').removeClass('active');
          $(this).closest('.tag').addClass('active');
        });
      $tagCard.find('.card-text').html(tag.description);
      $tagCard.find('.tag-open').on('click', function () {
        View.tag(tag.id);
      });
      $tagCard.appendTo($tagList);

      var findByTagCallback = function (flayList) {
        flayTotal += flayList.length;
        $('#summary').html(tagTotal + ' Tag, ' + flayTotal + ' Flay');

        $tagCard.data('flayList', flayList);
        $tagCard
          .find('.flay-count')
          .html(flayList.length)
          .addClass(flayList.length > 0 ? '' : 'flay-count-no');
        $tagCard.find('.tag-name').css({
          fontSize: flayList.length * 0.25 + 16,
        });
      };

      if (isLikeSearchChecked) {
        Rest.Flay.findByTagLike(tag, findByTagCallback);
      } else {
        Rest.Flay.findByTag(tag, findByTagCallback);
      }
    });
  });
}

tagLoad();
