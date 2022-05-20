/**
 * image.tablet.js
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import { LocalStorageItem, Popup, Random, PATH, File } from './lib/crazy.common.js';
import { Rest } from './lib/flay.rest.service.js';
import './lib/crazy.jquery';
import './css/common.scss';
import './image.tablet.scss';

var totalCount = 0;
var currIndex = 0;
var bgIntervalTime = LocalStorageItem.getInteger('image.tablet.bgIntervalTime', 10);
var bgInterval;
var bgSize;
var bgSizeProperties = ['contain', 'cover', 'auto'];
var bgSizePropertiesIndex = LocalStorageItem.getInteger('image.tablet.bgSizePropertiesIndex', 0);
var pause = false;
var random = LocalStorageItem.getBoolean('image.tablet.random', false);
var iWidth = LocalStorageItem.getInteger('image.tablet.imageWidth', 250);
var iHeight = LocalStorageItem.getInteger('image.tablet.imageHeight', 200);

var $imageWrap = $('#imageWrap');
var $controlBox = $('#controlBox');
var $progress = $('#paginationProgress > .progress-bar');

$imageWrap.navEvent(function (signal, e) {
  //		console.log('e.keyCode', signal);
  switch (signal) {
    case 32: // key space
      control.random();
      break;
    case 37: // key left
    case 1: // mousewheel up
      control.prev();
      break;
    case 39: // right
    case -1: // mousewheel down
      control.next();
      break;
    case 1001: // mouse left click
      break;
    case 1002: // mouse middle click
      $controlBox.trigger('bgMode');
      break;
  }
});

$controlBox
  .on('init', function () {
    //		console.log('$controlBox init');
    Rest.Image.size(function (count) {
      totalCount = count;
      $('#totalNo').html(totalCount);
    });
    $('#bgIntervalTime').val(bgIntervalTime);
    $('#iWidth').val(iWidth);
    $('#iHeight').val(iHeight);

    $('#random').toggleClass('active', random);
  })
  .on('setInfo', function (e, image, imgInfo) {
    $('#currNo').val(currIndex);
  })
  .on('notice', function (e, msg) {
    var $span = $('<span>', { class: 'msgBox' }).html(msg).appendTo($('#notice'));
    setTimeout(function () {
      $span.hide('blind', { direction: 'right' }, 500, function () {
        $(this).remove();
      });
    }, 1500);
  })
  .on('bgMode', function () {
    bgSize = bgSizeProperties[++bgSizePropertiesIndex % bgSizeProperties.length];
    $imageWrap.children().css('backgroundSize', bgSize);
    $('#bgMode').html(bgSize);
    LocalStorageItem.set('image.tablet.bgSizePropertiesIndex', bgSizePropertiesIndex);
  })
  .on('click', '#imgPath', function () {
    Rest.Flay.openFolder($(this).data('path'));
    $controlBox.trigger('notice', 'open folder: ' + $(this).data('path'));
  })
  .on('click', '#imgTitle', function () {
    Popup.imageByNo(currIndex);
    $controlBox.trigger('notice', 'pupup image: ' + currIndex);
  })
  .on('keyup', '#bgIntervalTime', function (e) {
    e.stopPropagation();
    if (e.keyCode === 13) {
      bgIntervalTime = parseInt(
        $(this)
          .val()
          .replace(/[^0-9]/g, '')
      );
      LocalStorageItem.set('image.tablet.bgIntervalTime', bgIntervalTime);
      $controlBox.trigger('notice', 'set interval ' + bgIntervalTime + 's');
      view();
    }
  })
  .on('click', '#pause', function () {
    pause = $(this).toggleClass('active').hasClass('active');
    $controlBox.trigger('notice', 'slide pause: ' + pause);
    view();
  })
  .on('click', '#random', function () {
    random = $(this).toggleClass('active').hasClass('active');
    LocalStorageItem.set('image.tablet.random', random);
    $controlBox.trigger('notice', 'slide random: ' + random);
  })
  .on('keyup', '#currNo', function (e) {
    e.stopPropagation();
    if (e.keyCode === 13) {
      control.jump(
        parseInt(
          $(this)
            .val()
            .replace(/[^0-9]/g, '')
        )
      );
      $controlBox.trigger('notice', 'go slide: ' + currIndex);
    }
  })
  .on('change', '#iWidth', function () {
    iWidth = $(this).val();
    $('.image-card').css('width', iWidth);
    LocalStorageItem.set('image.tablet.imageWidth', iWidth);
  })
  .on('change', '#iHeight', function () {
    iHeight = $(this).val();
    $('.image-card').css('height', iHeight);
    LocalStorageItem.set('image.tablet.imageHeight', iHeight);
  });

$progress.on('progress', function () {
  $(this).css({
    width: (((currIndex + 1) / totalCount) * 100).toFixed(1) + '%',
  });
});

var control = {
  jump: function (idx) {
    currIndex = idx;
    view();
  },
  random: function () {
    currIndex = Random.getInteger(0, totalCount);
    view();
  },
  prev: function () {
    currIndex--;
    view();
  },
  next: function () {
    currIndex++;
    view();
  },
};

var view = function () {
  function show() {
    if (random) {
      currIndex = Random.getInteger(0, totalCount);
    } else {
      if (currIndex >= totalCount) {
        currIndex = 0;
      } else if (currIndex < 0) {
        currIndex = totalCount - 1;
      }
    }

    var image = new Image();
    image.onload = function () {
      var _self = this;

      var $image = $('<div>', { class: 'image-card' })
        .css({
          backgroundImage: 'url(' + _self.src + ')',
        })
        .css({
          display: 'none',
          width: iWidth,
          height: iHeight,
        })
        .on('click', function () {
          var imageInfo = $(this).data('info');
          //					console.log("info", imageInfo);
          var $ret = $(this).toggleClass('full');
          if ($ret.hasClass('full')) {
            $ret
              .append(
                $('<div>').append(
                  $('<label>', { class: 'm-2' }).html(imageInfo.idx),
                  $('<label>', { class: 'hover m-2' })
                    .html(imageInfo.path.replace(/\\/gi, '/').split('/').pop())
                    .on('click', function (e) {
                      e.preventDefault();
                      e.stopPropagation();
                      Rest.Flay.openFolder(imageInfo.path);
                    }),
                  $('<label>', { class: 'hover m-2' })
                    .html(imageInfo.name)
                    .on('click', function (e) {
                      e.preventDefault();
                      e.stopPropagation();
                      Popup.imageByNo(imageInfo.idx);
                    }),
                  $('<label>', { class: 'm-2' }).html(imageInfo.width + 'x' + imageInfo.height),
                  $('<label>', { class: 'm-2' }).html(File.formatSize(imageInfo.length)),
                  $('<label>', { class: 'm-2' }).html(new Date(imageInfo.modified).format('yyyy-MM-dd'))
                )
              )
              .on('mousewheel', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).click();
                if (e.originalEvent.wheelDelta > 0) {
                  // wheel up
                  $(this).prev().click();
                } else {
                  // wheel down
                  $(this).next().click();
                }
              });
          } else {
            $ret.off('mousewheel').children().remove();
          }
        });
      $image.prependTo($imageWrap);

      bgSizePropertiesIndex--;
      $controlBox.trigger('bgMode');
      $progress.trigger('progress');

      $image.show(500);

      // get info
      Rest.Image.get(currIndex, function (info) {
        $image.data('info', info);
        info.width = _self.naturalWidth;
        info.height = _self.naturalHeight;
        $controlBox.trigger('setInfo', [_self, info]);
      });

      // overflow image remove
      $imageWrap.children().each(function () {
        var imageTop = $(this).position().top;
        var bgHeight = $imageWrap.height();
        if (imageTop > bgHeight) {
          $(this).remove();
        }
      });
    };
    image.src = PATH + '/static/image/' + currIndex;
  }

  clearInterval(bgInterval);
  show();
  if (!pause) {
    bgInterval = setInterval(function () {
      currIndex++;
      show();
    }, 1000 * bgIntervalTime);
    //			console.log('setInterval', bgIntervalTime);
  }
};

$controlBox.trigger('init');

control.random();
