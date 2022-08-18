/**
 * Image fall
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'bootstrap/dist/js/bootstrap';
import './lib/crazy.jquery';
import './components/FlayMenu';
import './css/common.scss';
import './image.fall.scss';

import { Rest } from './lib/flay.rest.service.js';
import { LocalStorageItem, PATH, Popup, Random } from './lib/crazy.common.js';

const Background = {
  imageIndexArray: [],
  bgInterval: null,
  count: 0,
  paneWidth: LocalStorageItem.getInteger('flay.background-image.paneWidth', 400),
  intervalTime: 3000,
  init: () => {
    Rest.Image.size((count) => {
      Background.count = count;
    });
    Background.event();
  },
  event: () => {
    const paneResize = () => {
      let addedPaneLength = Math.round($(window).width() / Background.paneWidth) - $('#background_images div.col').length;
      if (addedPaneLength > 0) {
        for (let i = 0; i < addedPaneLength; i++) {
          $('<div>', { class: 'col' }).appendTo($('#background_images'));
        }
      } else {
        for (; addedPaneLength < 0; addedPaneLength++) {
          $('#background_images div.col:last-child').remove();
        }
      }
      $('#background_images img').css({ height: '' });
    };
    paneResize();
    $(window).on('resize', paneResize);
    // paneWidth
    $('#paneWidth')
      .on('change', (e) => {
        Background.paneWidth = parseInt($(e.target).val(), 10);
        paneResize();
        LocalStorageItem.set('flay.background-image.paneWidth', Background.paneWidth);
      })
      .val(Background.paneWidth);
    // Picture switch
    $('#bgFlow').on('change', (e) => {
      if ($(e.target).prop('checked')) {
        Background.start();
      } else {
        Background.stop();
      }
    });
    const backgroundImageShow = LocalStorageItem.getBoolean('flay.background-image', true);
    if (backgroundImageShow) $('#bgFlow').parent().click();
    // Picture fall down
    $('#pictureFalldown').on('click', () => {
      for (let i = 0; i < 20; i++) {
        Background.func();
      }
    });
  },
  start: () => {
    Background.bgInterval = setInterval(Background.func, Background.intervalTime);
    LocalStorageItem.set('flay.background-image', true);
  },
  stop: () => {
    clearInterval(Background.bgInterval);
    LocalStorageItem.set('flay.background-image', false);
  },
  func: () => {
    // make image index array
    if (Background.imageIndexArray.length === 0) {
      Background.imageIndexArray = Array.apply(null, { length: Background.count }).map(Number.call, Number);
      console.info('image array reset', Background.imageIndexArray.length);
    }
    // determine image index
    const imageIndex = Background.imageIndexArray.splice(Random.getInteger(0, Background.imageIndexArray.length - 1), 1);
    if ($.isEmptyObject(imageIndex)) {
      console.warn('imageIndex is empty', Background.imageIndexArray.length, imageIndex);
      return;
    }
    // select image pane
    const paneLength = $('#background_images div.col').length;
    const $imageWrap = $('#background_images div.col:nth-child(' + Random.getInteger(1, paneLength) + ')');
    // load image
    const image = new Image();
    image.onload = () => {
      // calculate size
      const calcImgWidth = parseInt($imageWrap.width(), 10);
      const calcImgHeight = parseInt((calcImgWidth * image.naturalHeight) / image.naturalWidth, 10);
      // create and append jquery image
      const $thisImage = $(image)
        .css({ height: 0 })
        .on('click', () => {
          Popup.imageByNo(imageIndex);
        })
        .prependTo($imageWrap);
      // showing
      setTimeout(() => {
        $thisImage.css({
          height: calcImgHeight,
        });
      }, 100);
    };
    image.src = PATH + '/static/image/' + imageIndex;
    // overflow image remove
    $imageWrap.children().each((index, image) => {
      const imageTop = $(image).position().top;
      const bgHeight = $('#background_images').height();
      if (imageTop > bgHeight) {
        $(image).remove();
      }
    });
  },
};

Background.init();
Background.start();
