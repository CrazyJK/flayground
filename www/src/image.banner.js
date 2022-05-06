/**
 * image.banner
 */

import $ from 'jquery';
import { Rest, restCall } from './lib/flay.rest.service.js';
import { LocalStorageItem, PATH, Popup, Random } from './lib/crazy.common.js';
import { loading } from './lib/flay.loading.js';
import './lib/crazy.jquery';
import './image.banner.scss';

function ProgressBar(selector, args) {
  var DEFAULTS = {
    backgroundColor: '#000',
    foregronudColor: '#dc3545',
    height: '1px',
  };
  var settings = $.extend({}, DEFAULTS, args);

  this.selector = selector;
  this.$bar = $('<div>').addClass('progress-bar').css({
    width: '100%',
    height: settings.height,
    backgroundColor: settings.foregronudColor,
  });

  $(this.selector)
    .addClass('progress rounded-0')
    .css({
      height: settings.height,
      backgroundColor: settings.backgroundColor,
    })
    .empty()
    .append(this.$bar);

  console.log('ProgressBar.<init>', selector, args);
}
ProgressBar.prototype.setValue = function (curr, total) {
  this.$bar.css({
    width: ((curr / total) * 100).toFixed(1) + '%',
  });
  // console.log('ProgressBar.setValue', this.selector, curr, total);
};

function PlayEngine() {
  this.playIntervalID = 0;
}
PlayEngine.prototype.start = function (runFunc, pauseFunc) {
  this.runFunc = runFunc;
  this.pauseFunc = pauseFunc;
};
PlayEngine.prototype.run = function (seconds) {
  var _self = this;
  this.playIntervalID = setInterval(function () {
    console.log('setInterval', _self);
    _self.runFunc();
  }, 1000 * seconds);
};
PlayEngine.prototype.pause = function () {
  clearInterval(this.playIntervalID);
  this.pauseFunc();
};
PlayEngine.prototype.stop = function () {};

//1 x 1 pixel transparent
const blackDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';

var imageTotal = Rest.Image.size();
var imageIndex = LocalStorageItem.get('image.banner.index', Random.getInteger(0, imageTotal));
var panelWidth = LocalStorageItem.get('image.banner.width', 150);
var bitDepthVal = LocalStorageItem.get('image.banner.bitDepth', 'FOUR');
var pixelModeVal = LocalStorageItem.get('image.banner.pixelMode', 'TEXT');
var playEffectVal = LocalStorageItem.getInteger('image.banner.playEffect', '1');
var randomVal = LocalStorageItem.getBoolean('image.banner.random', false);
var autofitVal = LocalStorageItem.getBoolean('image.banner.autofit', false);
var autoRotateVal = LocalStorageItem.getBoolean('image.banner.autoRotate', false);
var autoMaxVal = LocalStorageItem.getBoolean('image.banner.autoMax', false);
var invertVal = LocalStorageItem.getBoolean('image.banner.invert', false);
var showThumbnailVal = LocalStorageItem.getBoolean('image.banner.showThumbnailSwitch', false);
var overlapImageVal = LocalStorageItem.getBoolean('image.banner.overlapImageSwitch', false);
var overlapBannerVal = LocalStorageItem.getBoolean('image.banner.overlapBannerSwitch', false);
var playIntervalVal = LocalStorageItem.getInteger('image.banner.play.interval', 5);
var imageAlphaVal = LocalStorageItem.get('image.banner.imageAlpha', '0.9');
var isPlay = false;
var bannerText = '';
var bannerBlank = '';
var playIntervalID = -1;
var bannerRemovalID = -1;
var overlapImageTimeoutID = -1;
var overlapBannerTimeoutID = -1;
var pageBar = new ProgressBar('#paginationProgress');

var playEngine = new PlayEngine();
playEngine.start(
  function () {
    console.log('run');
  },
  function () {
    console.log('pause');
  }
);

// initiate
$('#totalImageCount').html(imageTotal);
$('#index').val(imageIndex);
$('#width').val(panelWidth);
$('#invert').prop('checked', invertVal);
$('#random').prop('checked', randomVal);
$('#autofit').prop('checked', autofitVal);
$('#autoMax').prop('checked', autoMaxVal);
$('#autoRotate').prop('checked', autoRotateVal);
$('#playEffect').val(playEffectVal);
$('#playInterval').val(playIntervalVal);
$('#imageAlpha').val(imageAlphaVal);
$("input:radio[name='bitDepth']:radio[value='" + bitDepthVal + "']").prop('checked', true);
$("input:radio[name='pixelMode']:radio[value='" + pixelModeVal + "']").prop('checked', true);
$('#showThumbnailSwitch').prop('checked', showThumbnailVal);
$('#overlapImageSwitch').prop('checked', overlapImageVal);
$('#overlapBannerSwitch').prop('checked', overlapBannerVal);
$('#imageThumbPanel').toggle(showThumbnailVal);

// event listener
$("#invert, input[name='bitDepth'], input[name='pixelMode']").on('click', function (e) {
  show();
});
$('#index, #width').on('keyup', function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.keyCode === 13) {
    show();
  }
});
$('.monitor-size').on('click', function () {
  $('#width')
    .val($(this).text())
    .trigger($.Event('keyup', { keyCode: 13 }));
  // show();
});
$('#prevBtn').on('click', function (e) {
  if (--imageIndex < 0) {
    imageIndex = imageTotal - 1;
  }
  $('#index').val(imageIndex);
  show();
});
$('#nextBtn').on('click', function (e) {
  if (randomVal) {
    imageIndex = Random.getInteger(0, imageTotal);
  } else {
    ++imageIndex;
  }
  if (imageIndex >= imageTotal) {
    imageIndex = 0;
  }
  $('#index').val(imageIndex);
  show();
});
$('#playBtn').on('click', function () {
  isPlay = !$(this).data('isPlay');
  PlayProgress.init(0.2, playIntervalVal);
  if (isPlay) {
    playEngine.run(playIntervalVal);
    PlayProgress.run();
    playEffect();
    playIntervalID = setInterval(function () {
      PlayProgress.run();
      $('#nextBtn').click();
    }, 1000 * playIntervalVal);
  } else {
    playEngine.pause();
    PlayProgress.stop();
    clearInterval(playIntervalID);
    clearInterval(bannerRemovalID);
    clearTimeout(overlapImageTimeoutID);
    clearTimeout(overlapBannerTimeoutID);
  }
  $(this)
    .data('isPlay', isPlay)
    .html(isPlay ? 'STO<i>P</i>' : '<i>P</i>LAY');
});
$('#playEffect').on('change', function (e) {
  playEffectVal = parseInt($(this).val());
  LocalStorageItem.set('image.banner.playEffect', playEffectVal);
});
$('#random').on('change', function (e) {
  randomVal = $(this).is(':checked');
  LocalStorageItem.set('image.banner.random', randomVal);
});
$('#autofit')
  .on('change', function (e) {
    autofitVal = $(this).is(':checked');
    $('#width').prop('readonly', autofitVal);
    $('body').css('overflowY', autofitVal ? 'hidden' : 'auto');
    $('#autoRotate').prop('disabled', !autofitVal);
    $('#autoMax').prop('disabled', !autofitVal);
    LocalStorageItem.set('image.banner.autofit', autofitVal);
    show();
  })
  .trigger('change');
$('#autoRotate').on('change', function (e) {
  autoRotateVal = $(this).is(':checked');
  LocalStorageItem.set('image.banner.autoRotate', autoRotateVal);
  show();
});
$('#autoMax').on('change', function (e) {
  autoMaxVal = $(this).is(':checked');
  LocalStorageItem.set('image.banner.autoMax', autoMaxVal);
  show();
});
$('#invert')
  .on('change', function () {
    invertVal = $(this).is(':checked');
    $('pre#banner').toggleClass('bg-invert', invertVal);
    LocalStorageItem.set('image.banner.invert', invertVal);
  })
  .trigger('change');
$('#playInterval').on('change', function () {
  playIntervalVal = parseInt($(this).val());
  LocalStorageItem.set('image.banner.play.interval', playIntervalVal);
});
$('#imageAlpha').on('change', function () {
  imageAlphaVal = $(this).val();
  LocalStorageItem.set('image.banner.imageAlpha', imageAlphaVal);
});
$('#showThumbnailSwitch').on('change', function (e) {
  showThumbnailVal = $(this).is(':checked');
  $('#imageThumbPanel').toggle(showThumbnailVal);
  LocalStorageItem.set('image.banner.showThumbnailSwitch', showThumbnailVal);
});
$('#overlapImageSwitch')
  .on('change', function (e) {
    overlapImageVal = $(this).is(':checked');
    $('pre#banner').toggleClass('hide-bg', !overlapImageVal);
    LocalStorageItem.set('image.banner.overlapImageSwitch', overlapImageVal);
  })
  .trigger('change');
$('#overlapBannerSwitch')
  .on('change', function (e) {
    overlapBannerVal = $(this).is(':checked');
    $('pre#banner').text(overlapBannerVal ? bannerText : bannerBlank);
    LocalStorageItem.set('image.banner.overlapBannerSwitch', overlapBannerVal);
  })
  .trigger('change');
$('#controlBoxToggleBtn').on('click', function () {
  $('#controlBox > li:not(:last-child)').toggle('slow');
});
$('img#image').on('click', function () {
  Popup.imageByNo(imageIndex);
});
$('body').navEvent(function (signal, e) {
  console.log('navEvent', signal, e.key, e.target.id);
  switch (signal) {
    case 84: // 'T'
      $('#showThumbnailSwitch').click();
      break;
    case 66: // 'B'
      $('#overlapBannerSwitch').click();
      break;
    case 69: // 'E'
      var curr = parseInt($('#playEffect').val());
      var max = parseInt($('#playEffect').attr('max'));
      curr++;
      if (curr > max) {
        curr = 0;
      }
      $('#playEffect').val(curr).trigger('change');
      break;
    case 73: // 'I'
      $('#overlapImageSwitch').click();
      break;
    case 77: // 'M'
      $('#controlBoxToggleBtn').click();
      break;
    case 80: // 'P'
      $('#playBtn').click();
      break;
    case 82: // 'R'
      $('#random').click();
      break;
    case 86: // 'V'
      $('#invert').click();
      break;
    case 88: // 'X'
      $('#autoMax').click();
      break;
    case 79: // 'o'
      $('#autoRotate').click();
      break;
    case 65: // 'A'
      $('#autofit').click();
      break;
    case 37: // key left
      $('#prevBtn').click();
      break;
    case 39: // right
      $('#nextBtn').click();
      break;
    case 1001: // left mouse click
      if ($('#playBtn').data('isPlay')) {
        // stop play
        if ($(e.target).closest('#controlBox').length === 0) {
          $('#playBtn').click();
        }
      }
      break;
    case -1: // mouse wheel down
      if (autofitVal) {
        $('#nextBtn').click();
      }
      break;
    case 1: // mouse wheel up
      if (autofitVal) {
        $('#prevBtn').click();
      }
      break;
  }
  // $('i:containsIgnorecase(' + e.key + ')', e.target).effect('highlight');
});

function show() {
  $('body').navActive(false);

  imageIndex = parseInt($('#index').val());
  if (autofitVal) {
    panelWidth = Math.round(window.innerWidth / 5.5);
    $('#width').val(panelWidth);
  } else {
    panelWidth = $('#width').val();
  }
  // console.log('show', imageIndex);

  clearTimeout(overlapImageTimeoutID);
  clearTimeout(overlapBannerTimeoutID);
  clearInterval(bannerRemovalID);

  // load banner
  loadBanner();

  // load Image
  loadImage();
}

function loadBanner() {
  // reset banner
  $('pre#banner')
    .css({
      backgroundImage: 'url(' + blackDataUrl + ')',
      width: 'calc(' + panelWidth + ' * 5.5px)',
    })
    .empty();

  restCall(
    PATH + '/banner/' + imageIndex + '/' + panelWidth + '/0',
    {
      mimeType: 'text/plain',
      loadingDelay: 2000,
      data: $('form').serialize(),
    },
    function (text) {
      bannerText = text;
      bannerBlank = text.replace(/./g, '') + '\n';
      $('pre#banner').text(overlapBannerVal ? bannerText : bannerBlank);

      // overflow-y scale fix
      var scale = 1;
      var degree = 0;
      var topOffset = 0;
      var bannerWidth = $('pre#banner').width();
      var bannerHeight = $('pre#banner').height();
      if (autofitVal) {
        var bannerVerticalRatio = bannerHeight / bannerWidth;
        var isBannerVertical = bannerWidth < bannerHeight;
        var isWindowVertical = window.innerWidth < window.innerHeight;
        if (autoRotateVal && isBannerVertical !== isWindowVertical && (bannerVerticalRatio < 0.8 || 1.2 < bannerVerticalRatio)) {
          degree = 90;
          scale = window.innerHeight / bannerWidth;
          topOffset = (bannerWidth * scale) / 2 - bannerHeight / 2;
        } else if (autoMaxVal || window.innerHeight < bannerHeight) {
          scale = window.innerHeight / bannerHeight;
          topOffset = (bannerHeight * (scale - 1)) / 2;
        }
      }
      $('pre#banner').css({
        transform: 'scale(' + scale.toFixed(2) + ')' + ' rotate(' + degree + 'deg)',
        top: topOffset.toFixed(0) + 'px',
      });
      /* console.log({
			bannerSize: bannerWidth + " x " + bannerHeight,
			isBannerVertical: isBannerVertical,
			bannerVerticalRatio: bannerVerticalRatio,
			windowSize: window.innerWidth + " x " + window.innerHeight,
			isWindowVertical:  isWindowVertical,
			scale: scale.toFixed(2),
			degree: degree,
			topOffset: topOffset.toFixed(0)
		}); */

      // page progress
      // Progress.page(imageIndex + 1, imageTotal);
      pageBar.setValue(imageIndex + 1, imageTotal);

      if (isPlay) playEffect();

      LocalStorageItem.set('image.banner.index', imageIndex);
      LocalStorageItem.set('image.banner.width', panelWidth);
      LocalStorageItem.set('image.banner.invert', $("input[name='invert']").is(':checked'));
      LocalStorageItem.set('image.banner.bitDepth', $("input:radio[name='bitDepth']:checked").val());
      LocalStorageItem.set('image.banner.pixelMode', $("input:radio[name='pixelMode']:checked").val());

      $('body').navActive(true);
    },
    function (jqXHR, textStatus, errorThrown) {
      loading.error(new Text('Could not load the banner :( ' + '/banner/' + imageIndex + ' - ' + textStatus + ' - ' + errorThrown));
    }
  );
}

function playEffect() {
  function removeBanner(time) {
    $('#overlapBannerSwitch').prop('checked', false).trigger('change');
    var bannerArray = bannerText.split('\n');
    var bannerLineTotal = bannerArray.length;
    var bannerLineIndex = Math.floor(bannerLineTotal / 2);
    var up1 = 0,
      dn1 = 0,
      up2 = 0,
      dn2 = 0;
    var randomBoolean = Random.getBoolean();
    var indexArray = Array.from(Array(bannerLineTotal - 1).keys());

    //console.log('bannerLineTotal', bannerLineTotal, 'time', time, 'interval', time / bannerLineTotal * 4);

    $('pre#banner').text(bannerText);
    bannerRemovalID = setInterval(function () {
      if (randomBoolean) {
        up1 = bannerLineIndex;
        dn1 = bannerLineTotal - up1 - 1;
        up2 = up1 - 1;
        dn2 = dn1 + 1;
      } else {
        up1 = indexArray.splice(Random.getInteger(1, indexArray.length - 1), 1)[0];
        dn1 = indexArray.splice(Random.getInteger(1, indexArray.length - 1), 1)[0];
        up2 = indexArray.splice(Random.getInteger(1, indexArray.length - 1), 1)[0];
        dn2 = indexArray.splice(Random.getInteger(1, indexArray.length - 1), 1)[0];
      }

      bannerArray[up1] = '';
      bannerArray[dn1] = '';
      if (up2 < bannerLineTotal - 1) {
        bannerArray[up2] = '';
      }
      if (dn2 < bannerLineTotal - 1) {
        bannerArray[dn2] = '';
      }
      $('pre#banner').text(bannerArray.join('\n'));
      if (dn2 >= bannerLineTotal - 1 || indexArray.length === 0) {
        clearInterval(bannerRemovalID);
      }
      //console.log(up1, up2, dn1, dn2, bannerLineIndex, bannerLineTotal, $("pre#banner").text().split('\n').length);
      --bannerLineIndex;
      --bannerLineIndex;
    }, (time / bannerLineTotal) * 4);
  }

  clearTimeout(overlapImageTimeoutID);
  clearTimeout(overlapBannerTimeoutID);
  clearInterval(bannerRemovalID);

  if (playEffectVal === 0) {
    // do nothing
  } else if (playEffectVal === 1) {
    $('#overlapImageSwitch').prop('checked', false).trigger('change');
    $('#overlapBannerSwitch').prop('checked', true).trigger('change');

    overlapBannerTimeoutID = setTimeout(function () {
      $('#overlapImageSwitch').prop('checked', true).trigger('change');
      removeBanner(1000 * playIntervalVal - 4000);
    }, 2000);
  } else if (playEffectVal === 2) {
    $('#overlapImageSwitch').prop('checked', false).trigger('change');
    $('#overlapBannerSwitch').prop('checked', true).trigger('change');

    overlapImageTimeoutID = setTimeout(function () {
      $('#overlapImageSwitch').prop('checked', true).trigger('change');
    }, 1000 * ((playIntervalVal * 1) / 3));

    overlapBannerTimeoutID = setTimeout(function () {
      removeBanner(1000 * ((playIntervalVal * 1) / 3) - 1000);
    }, 1000 * ((playIntervalVal * 2) / 3));
  }
}

function loadImage() {
  let image = new Image();
  image.src = PATH + '/static/image/' + imageIndex;
  image
    .decode()
    .then(() => {
      // $("#imageSize").html(image.naturalWidth + ' x ' + image.naturalHeight);

      // get image dataurl
      let canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      var context = canvas.getContext('2d');
      context.globalAlpha = imageAlphaVal;
      context.drawImage(image, 0, 0);
      let imageDataUrl = canvas.toDataURL('image/png');
      // console.log(imageUri);

      // append image data
      $('img#image').attr('src', imageDataUrl);

      // overlap background
      $('pre#banner').css({
        backgroundImage: 'url(' + imageDataUrl + ')',
      });

      // load image info
      Rest.Image.get(imageIndex, function (info) {
        $('#imageTitle').html(info.name);
      });
    })
    .catch((e) => {
      loading.error(new Text('Could not load the image :( ' + image.src + ' - ' + e));
    });
}

var PlayProgress = {
  step: 0.1,
  max: 5,
  curr: 0,
  intervalID: null,
  playBar: new ProgressBar('#playProgress', {
    foregronudColor: '#007bff',
  }),
  init: function (step, max) {
    PlayProgress.step = step;
    PlayProgress.max = max;
    PlayProgress.playBar.$bar.css({
      transition: 'width ' + step + 's linear 0s',
    });
  },
  run: function () {
    PlayProgress.stop();
    PlayProgress.intervalID = setInterval(function () {
      PlayProgress.curr += PlayProgress.step;
      PlayProgress.playBar.setValue(PlayProgress.curr, PlayProgress.max);
    }, 1000 * PlayProgress.step);
  },
  stop: function () {
    PlayProgress.curr = 0;
    PlayProgress.playBar.setValue(0, PlayProgress.max);
    clearInterval(PlayProgress.intervalID);
  },
};

show();

window.returnFalse = function () {
  return false;
};
