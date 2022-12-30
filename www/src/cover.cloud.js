import $ from 'jquery';

import './components/FlayMenu';
import { LocalStorageItem, PATH, Random } from './lib/crazy.common';
import './lib/crazy.jquery.js';
import { Rest } from './lib/flay.rest.service';
import { View } from './lib/flay.utils';
import './lib/jquery.tagcanvas-flay.js';

import './cover.cloud.scss';
import './styles/common.scss';

const inputImageSize = document.getElementById('inputImageSize');
const inputPlayTime = document.getElementById('inputPlayTime');

var ImageControl = {
  STORAGE_IMAGE_KEY: 'cover.cloud.flay_key',
  STORAGE_IMAGE_SIZE: 'cover.cloud.image_size',
  STORAGE_PLAY_TIME: 'cover.cloud.play_time',
  imageIndexArray: [],
  bgInterval: null,
  collectedList: [],
  fullList: [],
  isStart: false,
  intervalCount: 0,
  init: function () {
    Rest.Flay.list(function (list) {
      ImageControl.fullList = list;
      var map = { ALL: list, Rank0: [], Rank1: [], Rank2: [], Rank3: [], Rank4: [], Rank5: [] };
      $.each(list, function (idx, flay) {
        var key = 'Rank' + flay.video.rank;
        if (map[key]) {
          map[key].push(flay);
        } else {
          map[key] = [flay];
        }
      });

      var $keys = $('#keys');
      $.each(map, function (k, v) {
        $('<label>', { class: 'check sm', id: 'key_' + k })
          .append(
            $('<input>', { type: 'radio', name: 'key' }).on('change', function (e) {
              ImageControl.setData(k, v);
            }),
            $('<span>').append(k, $('<i>', { class: 'badge ml-2' }).html(v.length))
          )
          .appendTo($keys);
      });

      var key = LocalStorageItem.get(ImageControl.STORAGE_IMAGE_KEY, 'ALL');
      $('#key_' + key).click();
    });

    ImageControl.ImageCanvas.resize();
    ImageControl.bgInterval = setInterval(ImageControl.func, 1000);
    ImageControl.nav();
    ImageControl.ImageCanvas.start();
  },
  setData: function (key, list) {
    console.log('setData', key, list.length);
    ImageControl.collectedList = list.slice();
    ImageControl.imageIndexArray = [];
    ImageControl.display();
    LocalStorageItem.set(ImageControl.STORAGE_IMAGE_KEY, key);
    $('#selectedKey').html(key);
  },
  nav: function () {
    $('#canvasContainer').navEvent(function (signal, e) {
      switch (signal) {
        case 32: // key: space
          ImageControl.ImageCanvas.rotate();
          break;
        case 34: // key: pageDown
          ImageControl.display();
          break;
      }
    });
  },
  play: function () {
    ImageControl.intervalCount = 0;
    ImageControl.isStart = true;
  },
  stop: function () {
    $('.progress-bar').css({ width: '100%', transition: 'none' });
    ImageControl.isStart = false;
  },
  func: function () {
    if (ImageControl.isStart) {
      var playTime = parseInt(inputPlayTime.value);
      ++ImageControl.intervalCount;

      if (ImageControl.intervalCount === 0) {
        $('.progress-bar').css({ transition: 'none' });
      } else if (ImageControl.intervalCount === 1) {
        $('.progress-bar').css({ transition: 'width 1s linear' });
      }

      $('.progress-bar').css({
        width: 100 - Math.round((ImageControl.intervalCount / playTime) * 100) + '%',
      });

      if (ImageControl.intervalCount == 0) {
        ImageControl.display();
      } else if (ImageControl.intervalCount == playTime) {
        ImageControl.intervalCount = -1;
      }
    }
  },
  display: function () {
    if (ImageControl.ImageCanvas.status === 'pause') {
      return;
    }
    // make image index array
    if (ImageControl.imageIndexArray.length === 0) {
      ImageControl.imageIndexArray = Array.apply(null, { length: ImageControl.collectedList.length }).map(Number.call, Number);
      console.log('image array reset', ImageControl.imageIndexArray.length);
    }

    var $imageWrap = $('#imagePane').empty();

    for (var i = 0; i < inputImageSize.value; i++) {
      // determine image index
      var imageIndex = ImageControl.imageIndexArray.splice(Random.getInteger(0, ImageControl.imageIndexArray.length - 1), 1);
      if ($.isEmptyObject(imageIndex)) {
        // console.log('imageIndex is empty', ImageControl.imageIndexArray.length, imageIndex);
      } else {
        var flay = ImageControl.collectedList[imageIndex];
        $('<a>')
          .attr({
            id: 'image' + i,
            'data-index': flay.opus,
          })
          .append(
            $('<img>').attr({
              src: PATH + '/static/cover/' + flay.opus,
            }),
            flay.title.substring(0, 32)
          )
          .on('click', function (e) {
            e.preventDefault();
            View.flay($(this).attr('data-index'));
          })
          .appendTo($imageWrap);
      }
    }

    $('.cloud-info').html('Remaining ' + ImageControl.imageIndexArray.length);

    ImageControl.ImageCanvas.reload();
  },
  ImageCanvas: {
    options: {
      bgColour: '#000',
      bgOutline: null,
      bgOutlineThickness: 0,
      bgRadius: 4,
      clickToFront: 300,
      depth: 0.9,
      fadeIn: 800,
      hideTags: true,
      imageMode: 'both',
      imagePosition: 'bottom',
      imageRadius: 4,
      imageScale: 0,
      imageMaxWidth: 400,
      imageMaxHeight: 0,
      initial: [0.1, -0.1],
      maxSpeed: 0.03,
      minBrightness: 0.3,
      minSpeed: 0.003,
      outlineMethod: 'none',
      padding: 2,
      reverse: true,
      textColour: '#fff',
      noTagsMessage: false,
    },
    status: '',
    start: function () {
      $('#imageCloud').tagcanvas(ImageControl.ImageCanvas.options, 'imagePane');
    },
    update: function () {
      $('#imageCloud').tagcanvas('update');
    },
    reload: function () {
      $('#imageCloud').tagcanvas('reload');
    },
    rotate: function () {
      $('#imageCloud').tagcanvas('rotatetag', { id: 'image' + Random.getInteger(0, inputImageSize.value - 1), lat: 0, lng: 0 });
    },
    pause: function () {
      $('#imageCloud').tagcanvas('pause');
      ImageControl.ImageCanvas.status = 'pause';
    },
    resume: function () {
      $('#imageCloud').tagcanvas('resume');
      ImageControl.ImageCanvas.status = 'resume';
    },
    resize: function () {
      $('#imageCloud').attr({
        width: $(window).width(),
        height: $(window).height(),
      });
    },
  },
};

inputImageSize.value = LocalStorageItem.getInteger(ImageControl.STORAGE_IMAGE_SIZE, 20);
inputPlayTime.value = LocalStorageItem.getInteger(ImageControl.STORAGE_PLAY_TIME, 30);

setTimeout(function () {
  $(window).on('resize', ImageControl.ImageCanvas.resize);
}, 5000);

$('#btnRotate').on('click', ImageControl.ImageCanvas.rotate);
$('#btnPause').on('click', function () {
  if ($(this).data('status') === 'resume') {
    ImageControl.ImageCanvas.pause();
    $(this).data('status', 'pause').html('<i class="fa fa-play"></i> Resume');
    $('#btnPlay, #btnNext, #btnRotate').prop('disabled', true);
  } else {
    ImageControl.ImageCanvas.resume();
    $(this).data('status', 'resume').html('<i class="fa fa-pause"></i> Pause');
    $('#btnPlay, #btnNext, #btnRotate').prop('disabled', false);
  }
});
$('#btnNext').on('click', ImageControl.display);
$('#btnPlay').on('click', function () {
  if ($(this).data('status') === 'stop') {
    ImageControl.play();
    $(this).data('status', 'start').html('<i class="fa fa-stop"></i> Stop');
    $('#btnPause').prop('disabled', true);
  } else {
    ImageControl.stop();
    $(this).data('status', 'stop').html('<i class="fa fa-play"></i> Play');
    $('#btnPause').prop('disabled', false);
  }
});
$('#inputImageSize').on('change', function () {
  LocalStorageItem.set(ImageControl.STORAGE_IMAGE_SIZE, $(this).val());
});
$('#inputPlayTime').on('change', function () {
  LocalStorageItem.set(ImageControl.STORAGE_PLAY_TIME, $(this).val());
});
$('#goHome').on('click', function () {
  location.href = PATH + '/dist/index.html';
});
$('#btnByKey, #btnCloseKey').on('click', function () {
  $('#keyContainer').slideToggle();
});

ImageControl.init();
