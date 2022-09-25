/**
 * Flay Vertical View Javascript
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'bootstrap/dist/js/bootstrap';
import './lib/crazy.jquery';
import './components/FlayMenu';
import './css/common.scss';
import './flay.vertical.scss';

import './lib/crazy.effect.neon.js';

import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5locales_ko_KR from '@amcharts/amcharts5/locales/ko_KR';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

import { COVER_RATIO, DEFAULT_SPECS, LocalStorageItem, PATH, Random, SessionStorageItem, File, StringUtils, NumberUtils } from './lib/crazy.common.js';
import { loading } from './lib/flay.loading.js';
import { Search, Util, View } from './lib/flay.utils.js';
import { Rest } from './lib/flay.rest.service.js';
import flayWebsocket from './lib/flay.websocket.js';
import { getDominatedColors } from './lib/crazy.dominated-color.js';

let flayList = [];
let collectedList = [];
let seenList = [];
let actressList = [];
let actressMap = {};
let tagList = [];

let currentFlay = null;
let currentIndex = -1;

let slideTimer;
let keyInputQueue = '';
let keyLastInputTime = Date.now();

const am5Root = am5.Root.new('chartdiv');
am5Root.setThemes([am5themes_Animated.new(am5Root)]);
am5Root.locale = am5locales_ko_KR;

const now = new Date();
const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));

const createTag = (tag) => {
  return $('<label>', { class: 'check sm' }).append($('<input>', { type: 'checkbox', 'data-tag-id': tag.id }).data('tag', tag), $('<span>', { title: tag.description }).html(tag.name));
};

$.fn.appendTag = function (tagList, tag) {
  return this.each(function () {
    const $this = $(this);
    if (tagList) {
      tagList.forEach((tag) => {
        $this.append(createTag(tag));
      });
    }
    if (tag) {
      $this.append(createTag(tag));
    }
  });
};

const Flaying = {
  isPlay: false,
  seekTime: 10,
  start: function (e) {
    e.stopPropagation();
    if (!Flaying.isPlay) {
      let $video = $('video');
      let _video = $video.get(0);
      const videoOpus = $video.data('opus');
      if (videoOpus !== currentFlay.opus) {
        $video
          .attr({
            poster: '/static/cover/' + currentFlay.opus,
            src: '/stream/flay/movie/' + currentFlay.opus + '/0',
          })
          .data('opus', currentFlay.opus);
      }
      $video
        .show()
        .off('wheel')
        .on('wheel', function (e) {
          e.stopPropagation();
          if (e.originalEvent.wheelDelta < 0) {
            Flaying.forward(e);
          } else {
            Flaying.backward(e);
          }
        });
      _video.play();
      $('#btnVideoClose').show();
      Flaying.isPlay = true;
    }
  },
  stop: function (e) {
    e.stopPropagation();
    let $video = $('video');
    let _video = $video.get(0);
    $video.hide().off('wheel');
    _video.pause();
    $('#btnVideoClose').hide();
    Flaying.isPlay = false;
  },
  forward: function (e) {
    let $video = $('video');
    let _video = $video.get(0);
    if (Flaying.isPlay) {
      // if built-in video seek, do nothing
      if (e.type !== 'wheel' && e.target.tagName === 'VIDEO') {
        return;
      }
      _video.currentTime += Flaying.seekTime;
    }
  },
  backward: function (e) {
    let $video = $('video');
    let _video = $video.get(0);
    if (Flaying.isPlay) {
      // if built-in video seek, do nothing
      if (e.type !== 'wheel' && e.target.tagName === 'VIDEO') {
        return;
      }
      _video.currentTime -= Flaying.seekTime;
    }
  },
};

const navigation = {
  event: function () {
    $('#pageContent').navEvent(function (signal, e) {
      console.debug(`navEvent target=${e.target.tagName} signal=${signal} type=${e.type} ctrl=${e.ctrlKey} alt=${e.altKey} shift=${e.shiftKey} key=${e.key}`);
      switch (signal) {
        case 1: // wheel: up
        case 37: // key  : left
          navigation.previous(e);
          break;
        case -1: // wheel: down
        case 39: {
          // key  : right
          let mode = $("input[name='autoSlideMode']:checked").val();
          if (mode === 'R') {
            navigation.random();
          } else {
            navigation.next(e);
          }
          break;
        }
        case 32: // keyup: space
          navigation.random();
          break;
        case 1002: // mouseup  : middle click
          navigation.random({
            play: true,
          });
          // $('.info-video').trigger('click'); // video play
          break;
        case 1001: // mouseup  : left click. auto slide off
          $('#autoSlide').prop('checked', false).trigger('change');
          break;
        case 36: // keyup: home
          navigation.go(0);
          break;
        case 35: // keyup: end
          navigation.go(collectedList.length - 1);
          break;
        case 33: // keyup: pageUp
          navigation.go(currentIndex - 9);
          break;
        case 34: // keyup: pageDown
          navigation.go(currentIndex + 9);
          break;
      }

      if (e.type === 'keyup') {
        // filter key
        // [a-z]: 65 ~ 90
        // [0-9]: 48 ~ 57, 96 ~ 105 (numpad)
        // -: 189, 109 (numpad)
        // enter: 13
        // backspace: 8
        if ((65 <= signal && signal <= 96) || (48 <= signal && signal <= 57) || (96 <= signal && signal <= 105) || 189 === signal || 109 === signal || 13 === signal || 8 === signal) {
          const currentTime = new Date().getTime();
          // 5s over, key reset
          if (currentTime - keyLastInputTime > 5000) {
            keyInputQueue = '';
          }
          keyLastInputTime = currentTime;

          switch (signal) {
            case 13: // enter
              // navigation.go of input text
              if (keyInputQueue !== '') {
                if ($.isNumeric(keyInputQueue)) {
                  // if number, go index
                  navigation.go(parseInt(keyInputQueue) - 1);
                } else {
                  // else, go opus
                  if (collectedList.length > 0) {
                    let foundIndex = -1;
                    collectedList.forEach((flay, index) => {
                      if (flay.opus === keyInputQueue.toUpperCase()) {
                        foundIndex = index;
                        return false;
                      }
                    });
                    if (foundIndex > -1) {
                      navigation.go(foundIndex);
                    } else {
                      loading.on('Notfound ' + keyInputQueue);
                    }
                  }
                }
                keyInputQueue = '';
              }
              break;
            case 8: // backspace
              keyInputQueue = keyInputQueue.slice(0, -1);
              break;
            default:
              keyInputQueue += e.key;
              break;
          }
          notice(keyInputQueue);
        }
      }
    });
  },
  on: function () {
    $('#pageContent').navActive(true);
  },
  off: function () {
    $('#pageContent').navActive(false);
  },
  previous: function (e) {
    if (Flaying.isPlay) {
      Flaying.backward(e);
    } else {
      navigation.go(currentIndex - 1);
    }
  },
  next: function (e) {
    if (Flaying.isPlay) {
      Flaying.forward(e);
    } else {
      navigation.go(currentIndex + 1);
    }
  },
  random: function (args) {
    if (!Flaying.isPlay) {
      let randomIndex = -1;
      do {
        randomIndex = Random.getInteger(0, collectedList.length - 1);
        console.debug(`random ${randomIndex} seen ${seenList.length} collect ${collectedList.length}`);
        if (!seenList.includes(randomIndex)) {
          break;
        }
      } while (seenList.length < collectedList.length);

      navigation.go(randomIndex, args);
    }
  },
  go: function (idx, args) {
    if (idx < 0 || idx > collectedList.length - 1) {
      console.warn(`navigation.go wrong index ${idx}`);
      return;
    }
    var prevIndex = currentIndex;
    currentIndex = idx;
    if (collectedList.length > 1 && prevIndex === currentIndex) {
      return;
    }
    currentFlay = collectedList[currentIndex];

    if (!seenList.includes(currentIndex)) {
      seenList.push(currentIndex);
      console.debug('seenList', seenList);
    }
    if (seenList.length === collectedList.length) {
      seenList = [];
      notice(`<span class="text-danger">Saw every flay</span>`);
    }

    showVideo(args);
    navigation.paging();
  },
  paging: function () {
    var addPaginationBtn = (idx) => {
      $('<li>', { class: 'page-item' + (idx === currentIndex ? ' active' : '') })
        .append(
          $('<a>', { class: 'page-link' })
            .on('click', function () {
              navigation.go(idx);
            })
            .html(idx + 1)
        )
        .appendTo($('.pagination'));
    };

    $('.pagination').empty();
    const pageLength = 12;
    var start = Math.max(currentIndex - (pageLength / 2 - 1), 0);
    var end = Math.min(currentIndex + pageLength / 2, collectedList.length);
    console.debug(`[paging] start=${start} end=${end}`);

    if (start > 0) {
      addPaginationBtn(0); // first page
    }
    for (var i = start; i < end; i++) {
      addPaginationBtn(i);
    }
    if (end < collectedList.length) {
      addPaginationBtn(collectedList.length - 1); // last page
    }

    $('#paginationProgress .progress-bar').css({
      width: (100 - ((currentIndex + 1) / collectedList.length) * 100).toFixed(2) + '%',
    });
  },
  slide: {
    on: function () {
      var run = function () {
        var mode = $("input[name='autoSlideMode']:checked").val();
        if (mode === 'R') {
          navigation.random();
        } else {
          if (currentIndex + 1 === collectedList.length) {
            currentIndex = -1;
          }
          navigation.next();
        }
      };
      run();
      slideTimer = setInterval(() => {
        run();
      }, 5000);
    },
    off: function () {
      clearInterval(slideTimer);
    },
  },
};

function attachPageEventListener() {
  // header tag select event
  $('#selectTags').on('change', 'input[data-tag-id]', function () {
    if ($('#tagPopup').prop('checked')) {
      var tagId = $(this).data('tag').id;
      View.tag(tagId);
      this.checked = !this.checked;
    } else {
      var checkedLength = $('#selectTags').find('input[data-tag-id]:checked').length;
      $('#tagCheck').prop('checked', checkedLength > 0);
      $('#pageContent').trigger('collect');
    }
  });

  // body tag event
  $('#videoTags').on('change', 'input[data-tag-id]', function () {
    var $this = $(this);
    var isChecked = $this.prop('checked');
    var toggledTag = $this.data('tag');
    if (isChecked) {
      Util.Tag.push(currentFlay.video.tags, toggledTag);
    } else {
      Util.Tag.remove(currentFlay.video.tags, toggledTag);
    }
    Rest.Video.update(currentFlay.video);
  });

  // new tag save
  $('.btn-tag-save').on('click', function () {
    var newTagName = $('#newTagName').val(),
      newTagDesc = $('#newTagDesc').val();
    if (newTagName != '') {
      var newTag = { name: newTagName, description: newTagDesc };
      Rest.Tag.create(newTag, function (createdTag) {
        Util.Tag.push(currentFlay.video.tags, createdTag);
        Rest.Video.update(currentFlay.video, function () {
          $('#selectTags > .tag-list').appendTag(null, createdTag);
          $('#videoTags').appendTag(null, createdTag);
          $("input[data-tag-id='" + createdTag.id + "']", '#videoTags').prop('checked', true);
          $('#newTagName, #newTagDesc').val('');
        });
      });
    }
  });

  // btnToggleNewTag
  $('#btnToggleNewTag').on('click', () => {
    $('#newTagForm').toggleClass('show');
  });

  // uncheck select Tag
  $('#tagCheck').on('change', function () {
    var count = $('input[data-tag-id]:checked', '#selectTags').length;
    if (count > 0) {
      $('input[data-tag-id]:checked', '#selectTags').prop('checked', false);
      $('#pageContent').trigger('collect');
    } else {
      this.checked = false;
    }
  });

  // query
  $('#search').on('keyup', function (e) {
    e.stopPropagation();
    if (e.keyCode == 13) {
      $('#pageContent').trigger('collect');
    }
  });

  // filter, rank & sort condition change
  $("#favorite, #noFavorite, #video, #subtitles, #rank0, #rank1, #rank2, #rank3, #rank4, #rank5, input[name='sort']").on('change', collectList);

  // collect
  $('#pageContent').on('collect', collectList);

  // navigation event
  navigation.event();

  // auto slide
  $('#autoSlide').on('change', function () {
    if (this.checked) {
      navigation.slide.on();
    } else {
      navigation.slide.off();
    }
  });

  // source
  $("input[name='source']").on('change', loadData);

  // toggle tags
  $('#tags').on('change', function () {
    $('#selectTags').slideToggle(this.checked);
    if (this.checked) {
      markStatisticsTag();
    }
  });
  // statistics studio
  $('#toggleStatisticsStudio').on('change', function () {
    $('#statisticsStudio').slideToggle(this.checked);
    if (this.checked) {
      markStatisticsStudio();
    }
  });
  // statistics actress
  $('#toggleStatisticsActress').on('change', function () {
    $('#statisticsActress').slideToggle(this.checked);
    if (this.checked) {
      markStatisticsActress();
    }
  });

  // data reload
  $('.btn-reload').on('click', function () {
    loadData();
  });

  // toggle option
  $('.toggle-option').on('click', function (e) {
    $('#options')
      .css({ left: e.clientX - $('#options').width() })
      .slideToggle(150);
  });

  // paginationProgress
  $('#paginationProgress').on('click', (e) => {
    navigation.go(parseInt(collectedList.length * (e.clientX / $('#paginationProgress').width())));
  });

  // window resize
  $(window).on('resize', function () {
    var coverWrapperWidth = $('.cover-wrapper').width();
    // var windowHeight = $(window).height();
    // var navHeight = $("nav.navbar").outerHeight();
    const $currCoverBox = $('.cover-wrapper-inner.curr > .cover-box');
    const currCoverBoxWidth = $currCoverBox.width();
    const currCoverBoxHeight = $currCoverBox.height();
    const calcWidth = (coverWrapperWidth - currCoverBoxWidth - 20) / 2;
    const calcHeight = calcWidth * COVER_RATIO;
    const $sideCover = $('.cover-wrapper-inner.prev > .cover-box, .cover-wrapper-inner.next > .cover-box');
    console.debug(`window resize currCoverBoxWidth: ${currCoverBoxWidth} calcWidth: ${calcWidth} currCoverBox.bg: ${$currCoverBox.css('background-image')}`);

    if (currCoverBoxWidth / 2 > calcWidth) {
      // too small, hide
      $sideCover.hide();
    } else if (currCoverBoxWidth < calcWidth) {
      // too large, set default
      $sideCover
        .css({
          width: currCoverBoxWidth,
          height: currCoverBoxHeight,
        })
        .show();
    } else {
      $sideCover
        .css({
          width: calcWidth,
          height: calcHeight,
        })
        .show();
    }
  });
}

function attachFlayEventListener() {
  // studio
  $('.info-studio')
    .on('click', function () {
      View.studio(currentFlay.studio);
    })
    .addClass('hover');
  // opus
  $('.info-opus').on('click', function () {
    View.video(currentFlay.opus);
  });
  // title
  $('.info-title').on('click', function () {
    View.flay(currentFlay.opus);
  });
  // video file
  $('.info-video').on('click', function () {
    if (currentFlay.files.movie.length > 0) {
      Rest.Flay.play(currentFlay, function () {
        let playCount = parseInt($('#playCount').text());
        $('#playCount').html(++playCount);
      });
    } else {
      Search.torrent(currentFlay);
    }
  });
  $('.info-play').on('click', () => {
    Rest.History.find(currentFlay.opus, (histories) => {
      let total = histories.length;
      let height = total * 29 + 68 + 16;
      let html = `<!DOCTYPE html>
				<html>
					<head>
						<title>${currentFlay.opus} - history</title>
						<style>
						body {margin: 0; background-color: #000; color: #fff;}
						main {display: flex;flex-wrap: wrap;}
						iframe {width: 100%; height: 300px; border: 0;}
						.history-item {display: flex; margin: 8px; width: 300px; gap: 8px;}
						.history-item > label:nth-child(1) {flex: 1 1 40px; text-align: right;}
						.history-item > label:nth-child(2) {flex: 1 1 100px;}
						.history-item > label:nth-child(3) {flex: 2 1 200px;}
						</style>
					</head>
					<body>
						<aside>
							<iframe src="/html/info/info.history.html?opus=${currentFlay.opus}"></iframe>
						</aside>
						<main>`;
      histories.forEach((history, index) => {
        html += `<div class="history-item">
								<label>${total--}</label>
								<label>${history.action}</label>
								<label>${history.date}</label>
							</div>`;
      });
      html += `
						</main>
						<script>
						document.addEventListener("DOMContentLoaded", function() {
							setTimeout(() => {
								window.resizeTo(400, document.body.querySelector("body > main").scrollHeight + 68 + 16 + 300);
							}, 500);
						});
						</script>
					</body>
				</html>
				`;
      console.debug('history', histories, html);
      const historyPopup = window.open('', 'historyPopup', 'width=400,height=' + height + ',' + DEFAULT_SPECS);
      historyPopup.document.open();
      historyPopup.document.write(html);
      // historyPopup.document.title = currentFlay.opus;
      historyPopup.document.close();
    });
  });
  // subtitles
  $('.info-subtitles').on('click', function () {
    if (currentFlay.files.subtitles.length > 0) {
      Rest.Flay.subtitles(currentFlay);
    } else {
      Search.subtitles(currentFlay.opus);
    }
  });
  // overview
  $('.info-overview').on('click', function () {
    $(this).hide();
    $('.info-overview-input').show().focus();
  });
  // overview input
  $('.info-overview-input').on('keyup', function (e) {
    e.stopPropagation();
    if (e.keyCode === 13) {
      var $this = $(this);
      currentFlay.video.comment = $(this).val();
      Rest.Video.update(currentFlay.video, function () {
        $this.hide();
        $('.info-overview')
          .html(!StringUtils.isBlank(currentFlay.video.comment) ? currentFlay.video.comment : 'Overview')
          .toggleClass('nonExist', StringUtils.isBlank(currentFlay.video.comment))
          .show();
      });
    }
  });
  // rank
  $("#ranker, input[name='ranker']").on('change', function () {
    currentFlay.video.rank = $(this).val();
    Rest.Video.update(currentFlay.video);
  });
  // actress name click
  $('.info-wrapper-actress').on('click', '.info-actress-name', function () {
    var actress = $(this).closest('.info-actress').data('actress');
    if (actress.name != 'Amateur') View.actress(actress.name);
  });
  // actress favorite click
  $('.info-wrapper-actress').on('click', '.info-actress-favorite i.fa', function () {
    var actress = $(this).closest('.info-actress').data('actress');
    var $self = $(this);
    actress.favorite = !actress.favorite;
    Rest.Actress.update(actress, function () {
      if (actress.favorite) {
        $self.switchClass('fa-heart-o', 'fa-heart favorite');
      } else {
        $self.switchClass('fa-heart favorite', 'fa-heart-o');
      }
      // update actress list
      Rest.Actress.list(function (list) {
        actressList = list;
      });
    });
  });
  // new tag input key event 		e.stopPropagation();
  $('#newTagName, #newTagDesc').on('keyup', function (e) {
    e.stopPropagation();
  });
  // add-basket-btn
  $('.add-basket-btn').on('click', function () {
    flayWebsocket.info('{"mode":"grap", "opus":"' + currentFlay.opus + '"}');
  });
  // control video stream
  $('.cover-wrapper-inner.curr > .cover-box').on('click', Flaying.start);
  $('.cover-wrapper-inner.curr > .cover-box > #btnVideoClose').on('click', Flaying.stop);
  // rename flay
  $('.file-wrapper .file-wrapper-rename input').on('keyup', (e) => {
    e.stopPropagation();
  });
  $('#rename-btn').on('click', () => {
    const newStudio = $('#rename-studio').val();
    const newOpus = $('#rename-opus').val();
    const newTitle = $('#rename-title').val();
    const newActress = $('#rename-actress').val();
    const newRelease = $('#rename-release').val();
    const newFlay = {
      studio: newStudio,
      opus: newOpus,
      title: newTitle,
      actressList: Util.Actress.toArray(newActress),
      release: newRelease,
    };
    Rest.Flay.rename(currentFlay.opus, newFlay, reloadCurrentFlay);
  });
  // original title, desc
  $('.info-original').on('click', () => {
    Search.translateByPapago(encodeURI(currentFlay.video.title + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + currentFlay.video.desc));
  });
}

function initCondition() {
  const fav = LocalStorageItem.getBoolean('flay.vertical.favorite', true);
  const nof = LocalStorageItem.getBoolean('flay.vertical.noFavorite', true);
  const vid = LocalStorageItem.getBoolean('flay.vertical.video', false);
  const sub = LocalStorageItem.getBoolean('flay.vertical.subtitles', false);
  const ranks = LocalStorageItem.split('flay.vertical.ranks', '1,0,0,0,0,0', ',');
  const sort = LocalStorageItem.get('flay.vertical.sort', 'M');
  const source = LocalStorageItem.get('flay.vertical.source', 'All');
  const autoSlide = LocalStorageItem.get('flay.vertical.autoSlideMode', 'F');

  $('#favorite').prop('checked', fav);
  $('#noFavorite').prop('checked', nof);
  $('#video').prop('checked', vid);
  $('#subtitles').prop('checked', sub);
  for (let x in ranks) {
    $('#rank' + x).prop('checked', ranks[x] === '1');
  }
  $('input[name="sort"][value="' + sort + '"]').prop('checked', true);
  $('input[name="source"][value="' + source + '"]').prop('checked', true);
  $('input[name="autoSlideMode"][value="' + autoSlide + '"]').prop('checked', true);
}

function loadData() {
  Promise.all([
    new Promise((resolve, reject) => {
      Rest.Tag.list(resolve);
    }),
    new Promise((resolve, reject) => {
      const source = $("input[name='source']:checked").val();
      if (source === 'All') {
        Rest.Flay.list(resolve);
      } else if (source === 'Low') {
        Rest.Flay.listOfLowScore(resolve);
      }
    }),
    new Promise((resolve, reject) => {
      Rest.Actress.list(resolve);
    }),
  ]).then((results) => {
    [tagList, flayList, actressList] = results;

    initTag();
    initActress();
    $('#pageContent').trigger('collect');
    $(window).trigger('resize');
  });

  SessionStorageItem.clear();
}

function initTag() {
  $('.tag-list > label:not(.label-add-tag)').remove();
  $('.tag-list').prepend(tagList.sort((t1, t2) => t1.name.localeCompare(t2.name)).map((tag) => createTag(tag)));
}

function initActress() {
  actressMap = actressList.reduce((map, actress) => {
    map.set(actress.name, actress);
    return map;
  }, new Map());
}

function collectList() {
  const compareTo = (data1, data2) => {
    var result = 0;
    if (typeof data1 === 'number') {
      result = data1 - data2;
    } else if (typeof data1 === 'string') {
      result = data1.toLowerCase().localeCompare(data2.toLowerCase());
    } else if (typeof data1 === 'object') {
      // maybe actressList
      result = Util.Actress.getNames(data1).localeCompare(Util.Actress.getNames(data2));
    } else {
      result = data1 > data2 ? 1 : -1;
    }
    return result;
  };
  const matchTag = (tag, flay) => {
    for (const flayTag of flay.video.tags) {
      if (flayTag.id === tag.id) {
        return true;
      }
    }
    if (flay.title.indexOf(tag.name) > -1) {
      // name
      return true;
    } else {
      // description
      var descArray = tag.description.split(',');
      if (descArray.length > 0) {
        for (var y in descArray) {
          var desc = descArray[y].trim();
          if (desc.length > 0) {
            if (flay.title.indexOf(desc) > 0) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };
  const containsFavoriteActress = (actressList) => {
    if ($.isEmptyObject(actressList)) {
      return false;
    }
    for (const actressName of actressList) {
      const actress = actressMap.get(actressName);
      if (actress.favorite) {
        return true;
      }
    }
    return false;
  };

  const loadingIndex = loading.on('Collect list');
  $('.video-wrapper').hide();

  const query = $('#search').val().trim();
  const fav = $('#favorite').prop('checked');
  const nof = $('#noFavorite').prop('checked');
  const vid = $('#video').prop('checked');
  const sub = $('#subtitles').prop('checked');
  const rank0 = $('#rank0').prop('checked') ? '0' : '';
  const rank1 = $('#rank1').prop('checked') ? '1' : '';
  const rank2 = $('#rank2').prop('checked') ? '2' : '';
  const rank3 = $('#rank3').prop('checked') ? '3' : '';
  const rank4 = $('#rank4').prop('checked') ? '4' : '';
  const rank5 = $('#rank5').prop('checked') ? '5' : '';
  const sort = $("input[name='sort']:checked").val();
  const source = $("input[name='source']:checked").val();
  const autoSlide = $("input[name='autoSlideMode']:checked").val();

  // save condition
  LocalStorageItem.set('flay.vertical.favorite', fav);
  LocalStorageItem.set('flay.vertical.noFavorite', nof);
  LocalStorageItem.set('flay.vertical.video', vid);
  LocalStorageItem.set('flay.vertical.subtitles', sub);
  LocalStorageItem.set(
    'flay.vertical.ranks',
    (function (r0, r1, r2, r3, r4, r5) {
      function parseBin(r) {
        return r !== '' ? 1 : 0;
      }
      return `${parseBin(r0)},${parseBin(r1)},${parseBin(r2)},${parseBin(r3)},${parseBin(r4)},${parseBin(r5)}`;
    })(rank0, rank1, rank2, rank3, rank4, rank5)
  );
  LocalStorageItem.set('flay.vertical.sort', sort);
  LocalStorageItem.set('flay.vertical.source', source);
  LocalStorageItem.set('flay.vertical.autoSlideMode', autoSlide);

  let selectedTags = [];
  $('input[data-tag-id]:checked', '#selectTags').each(function (idx, tagCheckbox) {
    selectedTags.push($(tagCheckbox).data('tag'));
  });

  // clear tag count info
  $('input[data-tag-id]', '#selectTags').each(function (index, tagCheckbox) {
    var tag = $(tagCheckbox).data('tag');
    tag.count = 0;
    $(tagCheckbox).next().addClass('nonExist');
  });

  // filtering
  seenList = [];
  collectedList = [];
  for (const flay of flayList) {
    // video, subtitles check
    let matched = false;
    if (vid && sub) {
      // 비디오와 자막 모두 있는
      matched = flay.files.movie.length > 0 && flay.files.subtitles.length > 0;
    } else if (vid && !sub) {
      // 비디오만 있는
      matched = flay.files.movie.length > 0 && flay.files.subtitles.length === 0;
    } else if (!vid && sub) {
      // 비디오 없이 자막만 있는
      matched = flay.files.movie.length === 0 && flay.files.subtitles.length > 0;
    } else {
      matched = flay.files.movie.length > 0 || flay.files.subtitles.length > 0;
    }
    if (!matched) {
      continue;
    }

    // rank check
    var rank = rank0 + rank1 + rank2 + rank3 + rank4 + rank5;
    if (rank.indexOf(flay.video.rank) < 0) {
      continue;
    }

    // actress favorite check
    if (fav && nof) {
      // all show
    } else if (fav && !nof) {
      if (!containsFavoriteActress(flay.actressList)) {
        continue;
      }
    } else if (!fav && nof) {
      if (containsFavoriteActress(flay.actressList)) {
        continue;
      }
    } else {
      // all show
    }

    if (query !== '') {
      if ((flay.studio + flay.opus + flay.title + flay.actressList.join(' ') + flay.release + flay.comment).toLowerCase().indexOf(query.toLowerCase()) < 0) {
        continue;
      }
    }

    // tag check all. id, name, desc
    if (selectedTags.length > 0) {
      let found = false;
      for (const tag of selectedTags) {
        found = matchTag(tag, flay);
        if (found) {
          break;
        }
      }
      if (!found) {
        continue;
      }
    }

    // tag count
    for (const tag of tagList) {
      if (matchTag(tag, flay)) {
        const dataTag = $("input[data-tag-id='" + tag.id + "']", '#selectTags').data('tag');
        if (dataTag) {
          dataTag.count++;
        }
      }
    }

    collectedList.push(flay);
  }

  // sorting
  collectedList.sort(function (flay1, flay2) {
    switch (sort) {
      case 'S': {
        const sVal = compareTo(flay1.studio, flay2.studio);
        return sVal === 0 ? compareTo(flay1.opus, flay2.opus) : sVal;
      }
      case 'O':
        return compareTo(flay1.opus, flay2.opus);
      case 'T':
        return compareTo(flay1.title, flay2.title);
      case 'A': {
        const aVal = compareTo(flay1.actressList, flay2.actressList);
        return aVal === 0 ? compareTo(flay1.opus, flay2.opus) : aVal;
      }
      case 'R': {
        const rVal = compareTo(flay1.release, flay2.release);
        return rVal === 0 ? compareTo(flay1.opus, flay2.opus) : rVal;
      }
      case 'M':
        return compareTo(flay1.lastModified, flay2.lastModified);
      case 'P': {
        const pVal = compareTo(flay1.video.play, flay2.video.play);
        return pVal === 0 ? compareTo(flay1.release, flay2.release) : pVal;
      }
    }
  });

  // collectedList show
  if (collectedList.length > 0) {
    navigation.random();
    $('.video-wrapper').show();
    loading.off(loadingIndex);
  } else {
    $('.pagination').empty();
    loading.error('Not found');
  }

  // display flay count of tag
  $('input[data-tag-id]', '#selectTags').each(function (index, tagCheckbox) {
    const tag = $(tagCheckbox).data('tag');
    $(tagCheckbox)
      .next()
      .toggleClass('nonExist', tag.count == 0)
      .empty()
      .append(tag.name, $('<i>', { class: 'badge tag-flay-count' }).html(tag.count));
  });

  // make statistics map
  const currentStudioMap = new Map();
  const currentActressMap = new Map();
  let count = 1;
  for (const flay of collectedList) {
    // flay.studio
    if (currentStudioMap.has(flay.studio)) {
      count = currentStudioMap.get(flay.studio);
      count++;
    } else {
      count = 1;
    }
    currentStudioMap.set(flay.studio, count);

    // flay.actressList
    for (const actressName of flay.actressList) {
      if (currentActressMap.has(actressName)) {
        count = currentActressMap.get(actressName);
        count++;
      } else {
        count = 1;
      }
      currentActressMap.set(actressName, count);
    }
  }

  // sort statistics map
  const studioMapAsc = new Map(
    [...currentStudioMap.entries()].sort((a, b) => {
      return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
    })
  );

  const actressMapAsc = new Map(
    [...currentActressMap.entries()].sort((a, b) => {
      return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
    })
  );

  const minCount = $("input[name='source']:checked").val() === 'Low' ? 1 : 5;
  $('#statisticsStudio')
    .empty()
    .append(
      $('<label>', { class: 'text hover text-info float-left' }).append(
        $('<span>')
          .html('Show All')
          .on('click', function () {
            $('#statisticsStudio .studioTag.hide').toggle();
            $(this).html($('#statisticsStudio .studioTag.hide:visible').length > 0 ? minCount + ' over' : 'Show All');
          })
      )
    );
  for (const [k, v] of studioMapAsc) {
    $('#statisticsStudio').append(
      $(`<label class="text hover studioTag ${v < minCount ? 'hide' : ''}">
					<span style="font-size: ${16 + v * 0.25}">${k}</span>
					<span class="badge">${v}</span>
				</label>`).data('k', k)
    );
  }
  $('#statisticsStudio .studioTag').on('click', (e) => {
    $('#search').val($(e.target).data('k'));
    $('#pageContent').trigger('collect');
  });
  $('#statisticsStudio > label:first-child').toggle(minCount > 1);

  $('#statisticsActress')
    .empty()
    .append(
      $('<label>', { class: 'text hover text-info float-left' }).append(
        $('<span>')
          .html('Show All')
          .on('click', function () {
            $('#statisticsActress .actressTag.hide').toggle();
            $(this).html($('#statisticsActress .actressTag.hide:visible').length > 0 ? minCount + ' over' : 'Show All');
          })
      )
    );
  for (const [k, v] of actressMapAsc) {
    const a = currentActressMap.get(k);
    $('#statisticsActress').append(
      $(`<label class="text hover actressTag ${v < minCount ? 'hide' : ''}">
					<span style="font-size: ${16 + v * 1}">
						<i class="fa ${a.favorite ? 'fa-heart' : ''}"></i>
						${k}
					</span>
					<span class="badge">${v}</span>
				</label>`).data('k', k)
    );
  }
  $('#statisticsActress .actressTag').on('click', (e) => {
    $('#search').val($(e.target).data('k'));
    $('#pageContent').trigger('collect');
  });
  $('#statisticsActress > label:first-child').toggle(minCount > 1);
}

function showVideo(args) {
  const setCoverAsBackground = (selector, opus, callback) => {
    if (opus) {
      if (SessionStorageItem.has(opus)) {
        $(selector).css({ backgroundImage: `url('${SessionStorageItem.get(opus)}')` });
        if (callback) callback(SessionStorageItem.get(opus));
      } else {
        Rest.Image.blobUrl(`${PATH}/static/cover/${opus}`, (blobUrl) => {
          SessionStorageItem.set(opus, blobUrl);
          $(selector).css({ backgroundImage: `url('${blobUrl}')` });
          if (callback) callback(SessionStorageItem.get(opus));
        });
      }
    } else {
      $(selector).css({ backgroundImage: `url('${PATH}/static/image/random?_=${Date.now()}')` });
    }
  };

  navigation.off();

  Promise.all([
    new Promise((resolve, reject) => {
      // actress
      $('.info-wrapper-actress').empty();
      currentFlay.actressList.forEach((name) => {
        if (name === 'Amateur') {
          return;
        }

        const actress = actressMap.get(name);
        if (actress === null) {
          throw 'not found actress: ' + name;
        }

        const $actress = $('<div>', { class: 'info-actress' })
          .data('actress', actress)
          .append(
            $('<label>', { class: 'text info-actress-favorite hover' }).append($('<i>', { class: 'fa ' + (actress.favorite ? 'favorite fa-heart' : 'fa-heart-o') }).css('min-width', 16)),
            $('<label>', { class: 'text info-actress-name hover', title: actress.comment }).html(name),
            $('<label>', { class: 'text info-actress-local' }).html(actress.localName),
            $('<label>', { class: 'text info-actress-flaycount' }).html('&nbsp;').neonLoading(true),
            $('<label>', { class: 'text info-actress-avgrank' }).html('&nbsp;').neonLoading(true),
            $('<label>', { class: 'text info-actress-age' }).html(Util.Actress.getAge(actress)),
            $('<label>', { class: 'text info-actress-birth' }).html(Util.Actress.getBirth(actress)),
            $('<label>', { class: 'text info-actress-body' }).html(Util.Actress.getBody(actress)),
            $('<label>', { class: 'text info-actress-height' }).html(Util.Actress.getHeight(actress)),
            $('<label>', { class: 'text info-actress-debut' }).html(Util.Actress.getDebut(actress))
          )
          .appendTo($('.info-wrapper-actress'));

        // flay count, rank avg
        Rest.Flay.findByActressAll(name, (flayListOfActress) => {
          const { cnt, avg, sd } = NumberUtils.calculateStandardDeviation(...flayListOfActress.map((flay) => flay.video.rank));
          const cntIns = flayListOfActress.filter((flay) => !flay.archive).length;
          $actress.find('.info-actress-flaycount').html(`${cntIns}<small>/${cnt}F</small>`).neonLoading(false);
          $actress
            .find('.info-actress-avgrank')
            .html(`${avg.toFixed(1)}<small>R/<span title="StandardDeviation">${sd.toFixed(1)}</span></small>`)
            .neonLoading(false);
        });
      });
      resolve(true);
    }),
    new Promise((resolve, reject) => {
      // history chart
      Rest.History.find(currentFlay.opus, (histories) => {
        const playHistories = histories.filter((history) => history.action === 'PLAY');
        if (playHistories.length > 0) {
          // 화면 밖으로 밀려나갈거 같으면 가리기
          const canVisible = window.innerHeight > $('.tag-wrapper').position().top + $('.tag-wrapper').height() + 100;
          if (canVisible) {
            drawGraph(histories);
          }
          $('.history-wrapper').toggle(canVisible);
          if (currentFlay.video.play !== playHistories.length) {
            currentFlay.video.play = playHistories.length;
            Rest.Video.update(currentFlay.video, () => {
              $('.info-play').html(`${currentFlay.video.play}<small>P</small>`);
              resolve(true);
            });
          } else {
            resolve(true);
          }
        } else {
          $('.history-wrapper').hide();
          resolve(true);
        }
      });
    }),
    new Promise((resolve, reject) => {
      // score
      $('.info-score').neonLoading(true);
      Rest.Flay.getScore(currentFlay.opus, (score) => {
        $('.info-score')
          .html(`${score}<small>S</small>`)
          .toggle(score > 0)
          .neonLoading(false);
        resolve(true);
      });
    }),
  ]).then(([r1, r2, r3]) => {
    if (args) {
      if (args.play) {
        $('.info-video').trigger('click');
      }
    }
    navigation.on();
  });

  // show cover
  setCoverAsBackground('.cover-wrapper-inner.curr > .cover-box', collectedList[currentIndex].opus, (blobUrl) => {
    if (SessionStorageItem.has(blobUrl)) {
      const dominatedColors = JSON.parse(SessionStorageItem.get(blobUrl));
      applyDominatedColor(dominatedColors);
    } else {
      getDominatedColors(blobUrl, { scale: 0.2, offset: 16, limit: 5 }).then((dominatedColors) => {
        SessionStorageItem.set(blobUrl, JSON.stringify(dominatedColors));
        applyDominatedColor(dominatedColors);
      });
    }
  });
  setCoverAsBackground('.cover-wrapper-inner.prev > .cover-box', collectedList[currentIndex - 1]?.opus);
  setCoverAsBackground('.cover-wrapper-inner.next > .cover-box', collectedList[currentIndex + 1]?.opus);

  // dominatedColor
  function applyDominatedColor(dominatedColors) {
    $('.cover-wrapper-inner.curr').css({
      boxShadow: `inset 0 0 1rem 0.5rem rgba(${dominatedColors[1].rgba.join(',')})`,
    });
    $('.cover-wrapper-inner.curr > .cover-box').css({
      boxShadow: `inset 0 0 1rem 0.5rem rgba(${dominatedColors[0].rgba.join(',')})`,
      backgroundColor: `rgba(${dominatedColors[0].rgba[0]},${dominatedColors[0].rgba[1]},${dominatedColors[0].rgba[2]},0.5)`,
    });
    $('.color-wrapper > label').each((index, label) => {
      $(label).css({
        backgroundColor: `rgba(${dominatedColors[index].rgba.join(',')})`,
      });
    });
  }

  // show Infomation
  // studio
  $('.info-studio').html(currentFlay.studio);
  // opus
  $('.info-opus').html(currentFlay.opus);
  // title
  $('.info-title').html(currentFlay.title);
  // release
  $('.info-release').html(currentFlay.release);
  // modified, last access
  const mDate = new Date(currentFlay.lastModified);
  const aDate = new Date(currentFlay.video.lastAccess);
  $('.info-modified').html(`<small><span title="lastModified">${mDate.format('yy/MM/dd')}</span> <i class="fa fa-arrow-${mDate > aDate ? 'left' : 'right'} mx-1"></i> <span title="lastAccess">${aDate.format('yy/MM/dd')}</span></small>`);
  // video file
  const movieSize = currentFlay.files.movie.length;
  $('.info-video')
    .html(movieSize === 0 ? 'Video' : (movieSize > 1 ? movieSize + 'V ' : '') + File.formatSize(currentFlay.length))
    .toggleClass('nonExist', movieSize === 0);
  // video play
  $('.info-play')
    .html(`${currentFlay.video.play}<small>P</small>`)
    .toggle(currentFlay.video.play > 0);
  // subtitles
  $('.info-subtitles')
    .html('Sub')
    .toggleClass('nonExist', currentFlay.files.subtitles.length === 0)
    .parent()
    .find('.link-subtitles')
    .remove();
  // overview
  $('.info-overview-input').val(currentFlay.video.comment).hide();
  $('.info-overview')
    .html(StringUtils.isBlank(currentFlay.video.comment) ? 'Overview' : currentFlay.video.comment)
    .toggleClass('nonExist', StringUtils.isBlank(currentFlay.video.comment))
    .show();
  // rank
  $('#ranker').val(currentFlay.video.rank);
  $("input[name='ranker'][value='" + currentFlay.video.rank + "']").prop('checked', true);
  // tag
  $('input:checked', '#videoTags.tag-list').prop('checked', false);
  currentFlay.video.tags.forEach((tag) => {
    $("input[data-tag-id='" + tag.id + "']", '#videoTags').prop('checked', true);
  });
  // files
  $('#file-wrapper > div > div:not(.file-wrapper-rename)').empty();
  currentFlay.files.cover.forEach((file) => {
    $('.file-wrapper-cover').append($('<label>', { class: 'text sm w-100' }).append(file, $('<span>', { class: 'text-transparent ms-2 float-end' }).html('<i class="fa fa-circle"></i>')));
  });
  currentFlay.files.movie.forEach((file) => {
    $('.file-wrapper-movie').append(
      $('<label>', { class: 'text sm w-100' }).append(
        file,
        $('<span>', { class: 'hover text-danger ms-2 float-end' })
          .html('<i class="fa fa-times"></i>')
          .on('click', () => {
            console.log(file);
            if (confirm('Will be delete ' + currentFlay.opus + ' movie\n' + file)) {
              Rest.Flay.deleteFileOnFlay(currentFlay.opus, file, reloadCurrentFlay);
            }
          })
      )
    );
  });
  currentFlay.files.subtitles.forEach((file) => {
    $('.file-wrapper-subtitles').append(
      $('<label>', { class: 'text sm w-100' }).append(
        file,
        $('<span>', { class: 'hover text-danger ms-2 float-end' })
          .html('<i class="fa fa-times"></i>')
          .on('click', () => {
            console.log(file);
            if (confirm('Will be delete ' + currentFlay.opus + ' subtitles\n' + file)) {
              Rest.Flay.deleteFileOnFlay(currentFlay.opus, file, reloadCurrentFlay);
            }
          })
      )
    );
  });
  // set rename input
  $('#rename-studio').val(currentFlay.studio);
  $('#rename-opus').val(currentFlay.opus);
  $('#rename-title').val(currentFlay.title);
  $('#rename-actress').val(currentFlay.actressList.join(', '));
  $('#rename-release').val(currentFlay.release);
  // set original title, desc
  $('.info-original').toggle(!StringUtils.isBlank(currentFlay.video.title) || !StringUtils.isBlank(currentFlay.video.desc));

  if ($('#selectTags').is(':visible')) {
    markStatisticsTag();
  }
  if ($('#statisticsStudio').is(':visible')) {
    markStatisticsStudio();
  }
  if ($('#statisticsActress').is(':visible')) {
    markStatisticsActress();
  }
}

function notice(msg) {
  $('.notice-bar')
    .empty()
    .append(
      $('<label>', { class: 'text sm' })
        .html(msg)
        .fadeOut(5000, function () {
          $(this).remove();
        })
    );
}

function reloadCurrentFlay() {
  console.log('reloadCurrentFlay', currentFlay.opus);
  Rest.Flay.get(currentFlay.opus, (newFlay) => {
    for (let flay of flayList) {
      if (flay.opus === newFlay.opus) {
        currentFlay = flay = newFlay;
        break;
      }
    }
    showVideo();
  });
}

function markStatisticsTag() {
  $('#selectTags > .tag-list > label')
    .removeClass('bg-danger')
    .each(function () {
      const $this = $(this);
      const name = $this.find('span').text();
      currentFlay.video.tags.forEach((tag) => {
        if (name.indexOf(tag.name) > -1) {
          $this.addClass('bg-danger');
        }
      });
    });
}

function markStatisticsStudio() {
  $('#statisticsStudio > .studioTag')
    .removeClass('text-danger')
    .each(function () {
      const name = $(this).find('span:first-child').text();
      if (currentFlay.studio === name) {
        $(this).addClass('text-danger');
      }
    });
}

function markStatisticsActress() {
  $('#statisticsActress > .actressTag')
    .removeClass('text-danger')
    .each(function () {
      const name = $(this).find('span:first-child').text();
      if (currentFlay.actressList.indexOf(name) > -1) {
        $(this).addClass('text-danger');
      }
    });
}

attachPageEventListener();
attachFlayEventListener();
initCondition();
loadData();

function drawGraph(historyList) {
  // init variables
  const dataMap = new Map();

  historyList.forEach((history) => {
    if (history.action === 'PLAY') {
      const key = history.date.substring(0, 10);
      if (dataMap.has(key)) {
        dataMap.get(key).push(history);
      } else {
        dataMap.set(key, [history]);
      }
    }
  });

  const dataArray = [
    {
      date: Date.now(),
      playCount: 0,
    },
  ];
  // convert map to array
  dataMap.forEach((val, key) => {
    dataArray.push({
      date: new Date(key).getTime(),
      playCount: val.length,
    });
  });
  // sort ascending by date
  dataArray.sort((d1, d2) => (d1.date > d2.date ? 1 : -1));
  // add oneYearAgo, if necessary
  if (dataArray[0].date > oneYearAgo.getTime()) {
    dataArray.unshift({
      date: oneYearAgo.getTime(),
      playCount: 0,
    });
  }

  // make chart
  am5Root.container.children.clear();
  let chart = am5Root.container.children.push(am5xy.XYChart.new(am5Root, {}));

  let cursor = chart.set(
    'cursor',
    am5xy.XYCursor.new(am5Root, {
      behavior: 'none',
    })
  );
  cursor.lineY.set('visible', false);

  let xAxis = chart.xAxes.push(
    am5xy.DateAxis.new(am5Root, {
      baseInterval: {
        timeUnit: 'day',
        count: 1,
      },
      renderer: am5xy.AxisRendererX.new(am5Root, { inside: true }),
    })
  );

  let xRenderer = xAxis.get('renderer');
  xRenderer.labels.template.setAll({
    fill: am5.color(0xffffff),
    fontSize: '12px',
  });

  let yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(am5Root, {
      min: 0,
      max: 1,
      renderer: am5xy.AxisRendererY.new(am5Root, { inside: true }),
    })
  );

  let yRenderer = yAxis.get('renderer');
  yRenderer.labels.template.setAll({
    visible: false,
  });

  let series = chart.series.push(
    am5xy.ColumnSeries.new(am5Root, {
      name: 'Series',
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: 'playCount',
      valueXField: 'date',
    })
  );

  series.data.setAll(dataArray);

  series.appear(1000);
  chart.appear(1000, 100);
}
