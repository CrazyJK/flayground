/**
 * image.slide.js
 */

import $ from 'jquery';
import { LocalStorageItem, Popup, Random, PATH } from './lib/crazy.common.js';
import { Rest } from './lib/flay.rest.service.js';
import { getDominatedColors } from './lib/crazy.dominated-color.js';

var totalCount = 0;
var currIndex = 0;
var bgIntervalTime = LocalStorageItem.getInteger('image.slide.bgIntervalTime', 10);
var bgInterval;
var bgSize;
var bgSizeProperties = ['contain', 'cover', 'auto'];
var bgSizePropertiesIndex = LocalStorageItem.getInteger('image.slide.bgSizePropertiesIndex', 0);
var pause = false;
var random = LocalStorageItem.getBoolean('image.slide.random', false);
var autofit = LocalStorageItem.getBoolean('image.slide.autofit', false);

var $image = $('#imageWrap');
var $controlBox = $('#controlBox');
var $progress = $('#paginationProgress > .progress-bar');

$image.navEvent(function (signal, e) {
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
      if (random) {
        $('#random').click();
      }
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
    bgSizePropertiesIndex--;
    $controlBox.trigger('bgMode');
    $('#bgIntervalTime').val(bgIntervalTime);

    $('#random').toggleClass('active', random);
    $('#autofit').toggleClass('active', autofit);
  })
  .on('setInfo', function (e, image, imgInfo) {
    $('#imgPath').html(imgInfo.path.replace(/\\/gi, '/').split('/').pop()).data('path', imgInfo.path);
    $('#imgTitle').html(imgInfo.name);
    $('#imgSize').html(image.naturalWidth + ' x ' + image.naturalHeight);
    $('#imgLength').html(File.formatSize(imgInfo.length));
    $('#imgModified').html(new Date(imgInfo.modified).format('yyyy-MM-dd'));
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
    $image.css('backgroundSize', bgSize);
    $('#bgMode').html(bgSize);
    LocalStorageItem.set('image.slide.bgSizePropertiesIndex', bgSizePropertiesIndex);
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
      LocalStorageItem.set('image.slide.bgIntervalTime', bgIntervalTime);
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
    LocalStorageItem.set('image.slide.random', random);
    $controlBox.trigger('notice', 'slide random: ' + random);
  })
  .on('click', '#autofit', function () {
    autofit = $(this).toggleClass('active').hasClass('active');
    LocalStorageItem.set('image.slide.autofit', autofit);
    $controlBox.trigger('notice', 'auto fit: ' + autofit);
    view();
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
      $image.css({
        backgroundImage: 'url(' + _self.src + ')',
      });
      $progress.trigger('progress');

      // rotate
      var factor = 1.0,
        degree = 0;
      if (autofit && bgSize === 'contain') {
        var isVerticalWindow = window.innerWidth < window.innerHeight;
        var isVerticalImage = _self.naturalWidth < _self.naturalHeight;
        var imageVerticalRatio = _self.naturalHeight / _self.naturalWidth;
        if (isVerticalWindow != isVerticalImage && (imageVerticalRatio < 0.8 || 1.2 < imageVerticalRatio)) {
          factor = isVerticalImage ? imageVerticalRatio : 1 / imageVerticalRatio;
          degree = 90;
        }
      }
      $image.css({
        transform: 'scale(' + factor.toFixed(2) + ') rotate(' + degree + 'deg)',
      });
      // console.log('currIndex', currIndex, 'isVerticalWindow', isVerticalWindow, 'isVerticalImage', isVerticalImage, 'imageVerticalRatio', imageVerticalRatio, 'factor', factor);

      getDominatedColors(_self.src, { scale: 0.1, offset: 16, ignore: [] }).then((dominatedColors) => {
        $image.css({
          boxShadow: `inset 0 0 4rem 2rem rgba(${dominatedColors[0].rgba.join(',')})`,
          backgroundColor: `rgba(${dominatedColors[0].rgba[0]},${dominatedColors[0].rgba[1]},${dominatedColors[0].rgba[2]},0.5)`,
        });
        $('body').css({
          backgroundColor: `rgba(${dominatedColors[0].rgba[0]},${dominatedColors[0].rgba[1]},${dominatedColors[0].rgba[2]},0.5)`,
        });
      });

      // get info
      Rest.Image.get(currIndex, function (info) {
        $controlBox.trigger('setInfo', [_self, info]);
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
