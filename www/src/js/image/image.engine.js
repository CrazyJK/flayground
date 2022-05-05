/**
 * image engine
 */

import $ from 'jquery';
import { Rest } from '../flay.rest.service.js';
import { LocalStorageItem, Popup, Random, PATH, DateUtils } from '../crazy.common.js';

function ProgressBar(selector, args) {
  var DEFAULTS = {
    backgroundColor: '#000',
    foregronudColor: '#dc3545',
    height: '1px',
    wrap: 'body',
    wrapClass: 'fixed-bottom',
  };
  var settings = $.extend({}, DEFAULTS, args);

  this.selector = selector;
  this.$bar = $('<div>').addClass('progress-bar').css({
    width: '100%',
    height: settings.height,
    backgroundColor: settings.foregronudColor,
  });

  $('<div>', { id: this.selector })
    .addClass('progress w-100 rounded-0')
    .css({
      height: settings.height,
      backgroundColor: settings.backgroundColor,
    })
    .append(this.$bar)
    .appendTo($(settings.wrap).addClass(settings.wrapClass));

  console.log('ProgressBar.<init>', selector, settings);
}
ProgressBar.prototype.setValue = function (curr, total) {
  this.$bar.css({
    width: ((curr / total) * 100).toFixed(1) + '%',
  });
};

function PlayBar(selector) {
  this.curr = 0;
  this.step = 1;
  this.interval = 10;
  this.intervalId = 0;

  this.$bar1 = $('<div>', { class: 'progress-bar' }).css({
    width: 0,
    transition: 'width .5s linear',
  });
  this.$bar2 = $('<div>', { class: 'progress-bar bg-warning' }).css('width', '0');
  this.$bar = $(selector)
    .addClass('progress')
    .css({
      width: '100%',
      height: '1px',
      margin: '0 4px',
    })
    .append(this.$bar1, this.$bar2);
  console.log('PlayBar.<init>', selector);
}
PlayBar.prototype.start = function (interval, step) {
  var _self = this;
  _self.interval = interval;
  if (step) {
    _self.step = step;
  }

  clearInterval(_self.intervalId);
  _self.curr = 0;
  _self.$bar1.css({
    width: '0%',
  });
  _self.$bar2.css({
    width: ((_self.step / _self.interval) * 100).toFixed(1) + '%',
  });
  _self.intervalId = setInterval(function () {
    _self.curr += _self.step;
    _self.$bar1.css({
      width: ((_self.curr / _self.interval) * 100).toFixed(1) + '%',
    });
    if (_self.curr >= _self.interval) {
      clearInterval(_self.intervalId);
    }
  }, 1000 * _self.step);
};
PlayBar.prototype.stop = function () {
  var _self = this;
  clearInterval(_self.intervalId);
  _self.$bar1.css({
    width: '0%',
  });
  _self.$bar2.css({
    width: '0%',
  });
};

function FlayImageEngine(args) {
  var DEFAULTS = {
    storagePrefix: 'engine.test',
    frameId: 'body',
    frameCss: {
      background: '#000 no-repeat center / contain fixed',
      transition: 'all 0.1s cubic-bezier(0.4, 0, 1, 1) 0s',
      margin: '1rem',
    },
    frameClass: 'full-screen rounded',
    key: {
      play: 'p',
      random: 'r',
    },
    showControlBox: true,
    imageInfo: ['title', 'size', 'length', 'path', 'modified'],
    viewFunc: null,
  };
  this.settings = $.extend({}, DEFAULTS, args);

  this.imageTotal = Rest.Image.size();
  this.$frame = $(this.settings.frameId).addClass(this.settings.frameClass).css(this.settings.frameCss);
  this.currentImageIndex = LocalStorageItem.getInteger(this.settings.storagePrefix + '.currentImageIndex', 0);
  this.isPlay = false;
  this.playIntervalID = 0;
  this.minPlayInterval = 3;
  this.playIntervalTime = LocalStorageItem.getInteger(this.settings.storagePrefix + '.playIntervalTime', this.minPlayInterval);
  this.nextRandom = LocalStorageItem.getBoolean(this.settings.storagePrefix + '.nextRandom', true);

  if ($('#pageWrap').length === 0) {
    $('<div>', { id: 'pageWrap' }).appendTo($('body'));
  }
  this.pageBar = new ProgressBar('pagination', { wrap: '#pageWrap' });

  var _self = this;

  function getSwitch(id, key, func, val) {
    return $('<div>', { class: 'custom-control custom-switch' }).append($('<input>', { type: 'checkbox', class: 'custom-control-input', id: id }).on('change', func).prop('checked', val), $('<label>', { class: 'custom-control-label text-capitalize', for: id, title: id + ' ' + key }).html(id));
  }

  // draw control box
  if (_self.settings.showControlBox) {
    var infoBoxHeight = 0;

    if (_self.settings.imageInfo.length > 0) {
      $('<div>', { id: 'infoBox', class: 'text-light small py-1' })
        .css({
          position: 'fixed',
          bottom: 0,
          right: 0,
          fontFamily: 'D2Coding',
          backgroundColor: '#000',
          borderTop: '1px solid #333',
          borderLeft: '1px solid #333',
          borderTopLeftRadius: '4px',
        })
        .append(
          (function () {
            var infos = [];
            for (var x in _self.settings.imageInfo) {
              var $info = $('<span>', { id: _self.settings.imageInfo[x], class: 'mx-2' });
              if ('title' === _self.settings.imageInfo[x]) {
                $info.addClass('hover');
              }
              infos.push($info);
            }
            return infos;
          })()
        )
        .appendTo($('body'));

      $('#infoBox #title').on('click', () => {
        Popup.imageByNo(_self.currentImageIndex);
      });

      infoBoxHeight = $('#infoBox').outerHeight();
    }

    $('<div>', { id: 'controlBox', class: 'text-light small p-1' })
      .css({
        position: 'fixed',
        bottom: 0,
        right: 0,
        fontFamily: 'D2Coding',
        backgroundColor: '#000',
        margin: '0 0 ' + infoBoxHeight + 'px',
        borderTop: '1px solid #333',
        borderLeft: '1px solid #333',
        borderTopLeftRadius: '4px',
      })
      .append(
        $('<ul>', { class: 'list-unstyled text-center m-0' }).append(
          $('<li>').append(
            getSwitch(
              'random',
              _self.settings.key.random,
              function () {
                _self.nextRandom = $(this).is(':checked');
                LocalStorageItem.set(_self.settings.storagePrefix + '.nextRandom', _self.nextRandom);
              },
              _self.nextRandom
            )
          ),
          $('<li>', { class: 'mb-1' }).append(
            $('<div>', { class: 'rounded' })
              .css({
                border: '1px solid #333',
                display: 'flex',
                flexWrap: 'wrap',
              })
              .append(
                $('<label>')
                  .css({
                    margin: '0',
                    padding: '0 4px',
                    color: '#bdcad7',
                    fontWeight: '500',
                  })
                  .html('playInterval'),
                $('<input>', { type: 'number', min: _self.minPlayInterval, id: 'playInterval', class: 'bg-transparent border-0 text-light text-right' })
                  .css({
                    flex: '1 1 auto',
                    width: 0,
                  })
                  .val(_self.playIntervalTime)
                  .on('change', function () {
                    _self.playIntervalTime = $(this).val();
                    LocalStorageItem.set(_self.settings.storagePrefix + '.playIntervalTime', _self.playIntervalTime);
                    if (_self.isPlay) {
                      _self.stop();
                      _self.play();
                    }
                  }),
                $('<div>', { id: 'playIntervalBar' })
              )
          ),
          $('<li>', { class: 'mb-1' }).append(
            $('<div>', { class: 'rounded' })
              .css({
                border: '1px solid #333',
                display: 'flex',
                flexWrap: 'wrap',
              })
              .append(
                $('<label>')
                  .css({
                    margin: '0',
                    padding: '0 4px',
                    color: '#bdcad7',
                    fontWeight: '500',
                  })
                  .html('Index'),
                $('<input>', { type: 'number', min: 9, id: 'imageIndexInput', class: 'bg-transparent border-0 text-light text-right' })
                  .css({
                    flex: '1 1 auto',
                    width: 0,
                  })
                  .val(_self.currentImageIndex)
                  .on('change', function () {
                    _self.currentImageIndex = $(this).val();
                    _self.view();
                  }),
                $('<label>')
                  .css({
                    margin: '0',
                    padding: '0 4px',
                    color: '#bdcad7',
                    fontWeight: '500',
                  })
                  .html('/ ' + _self.imageTotal)
              )
          ),
          $('<li>').append(
            $('<div>', { class: 'btn-group btn-group-sm btn-block' }).append(
              $('<button>', { class: 'btn btn-flay py-0 text-capitalize', id: 'prev', type: 'button' })
                .html('prev')
                .on('click', function () {
                  _self.prev();
                }),
              $('<button>', { class: 'btn btn-flay py-0 text-capitalize', id: 'play', type: 'button' })
                .html('play')
                .on('click', function () {
                  _self.togglePlay();
                }),
              $('<button>', { class: 'btn btn-flay py-0 text-capitalize', id: 'next', type: 'button' })
                .html('next')
                .on('click', function () {
                  _self.next();
                })
            )
          )
        )
      )
      .appendTo($('body'));

    this.playBar = new PlayBar('#playIntervalBar');
  }

  // add event listener
  $(this.settings.frameId)
    .navActive(false)
    .navEvent(function (signal, e) {
      console.log('navEvent', signal, e.type, e.key, e.target);
      if (e.type === 'keyup') {
        switch (e.key) {
          case _self.settings.key.play:
            _self.togglePlay();
            break;
          case _self.settings.key.random:
            _self.toggleNextRandom();
            break;
          case 'c':
            $('#controlBox, #infoBox').toggle();
            break;
          case 'ArrowRight':
            _self.next();
            break;
          case 'ArrowLeft':
            _self.prev();
            break;
          case 'PageUp':
            _self.playIntervalUp();
            break;
          case 'PageDown':
            _self.playIntervalDown();
            break;
        }
      } else {
        switch (signal) {
          case 1001: // left click
            if ($(e.target).closest('#controlBox').length === 0) {
              _self.togglePlay(false);
            }
            break;
          case 1002: // middle click
            break;
          case 1003: // right click
            break;
          case 1: // wheel up
            _self.prev();
            break;
          case -1: // wheel down
            _self.next();
            break;
        }
      }
    });
}

FlayImageEngine.prototype.playIntervalUp = function () {
  var _self = this;
  _self.playIntervalTime++;
  if (_self.settings.showControlBox) $('#playInterval').val(_self.playIntervalTime);
  LocalStorageItem.set(_self.settings.storagePrefix + '.playIntervalTime', _self.playIntervalTime);
  if (_self.isPlay) {
    _self.stop();
    _self.play();
  }
};

FlayImageEngine.prototype.playIntervalDown = function () {
  var _self = this;
  if (_self.playIntervalTime > _self.minPlayInterval) {
    _self.playIntervalTime--;
    if (_self.settings.showControlBox) $('#playInterval').val(_self.playIntervalTime);
    LocalStorageItem.set(_self.settings.storagePrefix + '.playIntervalTime', _self.playIntervalTime);
    if (_self.isPlay) {
      _self.stop();
      _self.play();
    }
  }
};

FlayImageEngine.prototype.toggleNextRandom = function () {
  var _self = this;
  _self.nextRandom = !_self.nextRandom;
  if (_self.settings.showControlBox) $('#random').prop('checked', _self.nextRandom);
  LocalStorageItem.set(_self.settings.storagePrefix + '.nextRandom', _self.nextRandom);
};

FlayImageEngine.prototype.togglePlay = function (isPlay) {
  var _self = this;
  if (typeof isPlay === 'boolean') {
    _self.isPlay = !isPlay;
  }
  if (!_self.isPlay) {
    _self.play();
    if (_self.settings.showControlBox) $('#play').html('stop');
  } else {
    _self.stop();
    if (_self.settings.showControlBox) $('#play').html('play');
  }
};

FlayImageEngine.prototype.prev = function () {
  --this.currentImageIndex;
  if (this.currentImageIndex < 0) {
    this.currentImageIndex = this.imageTotal - 1;
  }
  this.view();
};

FlayImageEngine.prototype.next = function () {
  if (this.nextRandom) {
    this.currentImageIndex = Random.getInteger(0, this.imageTotal - 1);
  } else {
    ++this.currentImageIndex;
    if (this.imageTotal <= this.currentImageIndex) {
      this.currentImageIndex = 0;
    }
  }
  this.view();
};

FlayImageEngine.prototype.view = function () {
  var _self = this;
  let image = new Image();
  image.src = PATH + '/static/image/' + _self.currentImageIndex;
  image.decode().then(() => {
    if (_self.settings.viewFunc) {
      _self.settings.viewFunc(_self.currentImageIndex, image);
    } else {
      _self.$frame.css({
        backgroundImage: 'url(' + image.src + ')',
      });
    }

    if (_self.settings.showControlBox) {
      $('#imageIndexInput').val(_self.currentImageIndex);
      _self.pageBar.setValue(_self.currentImageIndex, _self.imageTotal);
      if (_self.settings.imageInfo.length > 0) {
        Rest.Image.get(_self.currentImageIndex, function (info) {
          $('#title').html(info.name);
          $('#size').html(image.naturalWidth + ' x ' + image.naturalHeight);
          $('#length').html(File.formatSize(info.length));
          $('#path').html(info.path.replace(/\\/gi, '/').split('/').pop());
          $('#modified').html(DateUtils.format('yyyy-MM-dd', info.modified));
        });
      }
    }
    LocalStorageItem.set(_self.settings.storagePrefix + '.currentImageIndex', _self.currentImageIndex);
  });
};

FlayImageEngine.prototype.play = function (seconds) {
  var _self = this;
  if (seconds) {
    _self.playIntervalTime = seconds;
  }

  _self.playBar.start(_self.playIntervalTime);
  _self.playIntervalID = setInterval(function () {
    _self.playBar.start(_self.playIntervalTime);
    if (_self.nextRandom) {
      _self.currentImageIndex = Random.getInteger(0, _self.imageTotal - 1);
    } else {
      _self.currentImageIndex++;
    }
    _self.view();
  }, 1000 * _self.playIntervalTime);

  _self.isPlay = true;

  console.log('FlayImageEngine', 'play', _self.playIntervalTime);
};

FlayImageEngine.prototype.stop = function () {
  var _self = this;
  _self.playBar.stop();
  clearInterval(_self.playIntervalID);
  _self.isPlay = false;
  console.log('FlayImageEngine', 'stop');
};
