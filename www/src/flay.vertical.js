/**
 * Flay Vertical View Javascript
 */

import bb, { bubble } from 'billboard.js';
import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';

import './components/FlayMenu';
import { DateUtils, DEFAULT_SPECS, File, LocalStorageItem, NumberUtils, PATH, Random, SessionStorageItem, StringUtils } from './lib/crazy.common';
import { getDominatedColors } from './lib/crazy.dominated-color';
import './lib/crazy.effect.neon';
import './lib/crazy.jquery';
import { loading } from './lib/flay.loading';
import { Rest } from './lib/flay.rest.service';
import { Search, Util, View } from './lib/flay.utils';

import './flay.vertical.scss';
import './styles/common.scss';

const grapChannel = new BroadcastChannel('grap_channel');

let flayList = [];
let collectedList = [];
let seenList = [];
let history = { on: false, list: [], pointer: -1 };

let actressList = [];
/** Map<Name, Actress> */
let mapNameActress = new Map();

let tagList = [];
let tagMap = new Map();

let currentFlay = null;
let currentIndex = -1;

let slideTimer;
let keyInputQueue = '';
let keyLastInputTime = Date.now();

// for billboard chart
let chart;
const now = new Date();
const startAxisForChart = `${now.getFullYear() - 1}-01`;
const endAxisForChart = DateUtils.format('yyyy-MM', now);
let releaseForChart = startAxisForChart;
let playMaxForChart = 0;

const createTag = (tag) => $('<label>', { class: 'check sm' }).append($('<input>', { type: 'checkbox', 'data-tag-id': tag.id }).data('tag', tag), $('<span>', { title: tag.description }).html(tag.name));

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
  start(e) {
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
  stop(e) {
    e.stopPropagation();
    let $video = $('video');
    let _video = $video.get(0);
    $video.hide().off('wheel');
    _video.pause();
    $('#btnVideoClose').hide();
    Flaying.isPlay = false;
  },
  forward(e) {
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
  backward(e) {
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
  event() {
    $('#pageContent').navEvent(function (signal, e) {
      switch (signal) {
        case 1: // wheel: up
        case 37: // key  : left
        case 1004: // mouseup : prev   click
          navigation.previous(e);
          break;
        case -1: // wheel: down
        case 1005: // mouseup : next   click
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
        case 38: // keyup: ArrowUp
          navigation.history(-1);
          break;
        case 40: // keyup: ArrowDown
          navigation.history(1);
          break;
      }

      if (e.type === 'keyup') {
        // filter key
        // [a-z]: 65 ~ 90
        // [0-9]: 48 ~ 57, 96 ~ 105 (numpad)
        // [-]: 189, 109 (numpad)
        // [enter]: 13
        // [backspace]: 8
        // [esc]: 27
        if ((65 <= signal && signal <= 96) || (48 <= signal && signal <= 57) || (96 <= signal && signal <= 105) || 189 === signal || 109 === signal || 13 === signal || 8 === signal || 27 === signal) {
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
            case 27: // esc
              keyInputQueue = '';
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
  on() {
    $('#pageContent').navActive(true);
  },
  off() {
    $('#pageContent').navActive(false);
  },
  previous(e) {
    if (Flaying.isPlay) {
      Flaying.backward(e);
    } else {
      navigation.go(currentIndex - 1);
    }
  },
  next(e) {
    if (Flaying.isPlay) {
      Flaying.forward(e);
    } else {
      navigation.go(currentIndex + 1);
    }
  },
  random(args) {
    if (!Flaying.isPlay) {
      let randomIndex = -1;
      do {
        randomIndex = Random.getInteger(0, collectedList.length - 1);
        // console.debug(`random ${randomIndex} seen ${seenList.length} collect ${collectedList.length}`);
        if (!seenList.includes(randomIndex)) {
          break;
        }
      } while (seenList.length < collectedList.length);

      navigation.go(randomIndex, args);
    }
  },
  history(step) {
    // history 이동
    if (-1 < history.pointer + step && history.pointer + step < history.list.length) {
      history.on = true;
      history.pointer += step;
      const id = history.list[history.pointer];
      console.debug(`history index ${history.pointer} -> ${id}`);
      notice(`<span class="text-info">${history.list.map((v, i) => `<span class="${i === history.pointer ? 'text-warning' : ''}">${v}</span>`)}</span>`);
      navigation.go(id, { history: true });
    } else {
      notice(`<span class="text-warning">history overflow</span>`);
    }
  },
  go(idx, args) {
    if (idx < 0 || idx > collectedList.length - 1) {
      console.warn(`navigation.go wrong index ${idx}`);
      return;
    }
    const prevIndex = currentIndex;
    currentIndex = idx;
    if (collectedList.length > 1 && prevIndex === currentIndex) {
      return;
    }
    currentFlay = collectedList[currentIndex];

    // history
    if (!args?.history) {
      history.on = false;
      history.list.push(currentIndex);
      history.pointer = history.list.length - 1;
      console.debug('history.list', history.list);
      console.debug('history.pointer', history.pointer);

      if (!seenList.includes(currentIndex)) {
        seenList.push(currentIndex);
      }
      console.debug('seenList', seenList);
      if (seenList.length === collectedList.length) {
        seenList = [];
        notice(`<span class="text-danger">Saw every flay</span>`);
      }
    }

    showVideo(args);
    navigation.paging();
  },
  paging() {
    const addPaginationBtn = (idx) => {
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
    const start = Math.max(currentIndex - (pageLength / 2 - 1), 0);
    const end = Math.min(currentIndex + pageLength / 2, collectedList.length);
    // console.debug(`[paging] start=${start} end=${end}`);

    if (start > 0) {
      addPaginationBtn(0); // first page
    }
    for (let i = start; i < end; i++) {
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
    on() {
      const run = () => {
        const mode = $("input[name='autoSlideMode']:checked").val();
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
    off() {
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
  $('#favorite, #noFavorite, #video, #subtitles, #rank0, #rank1, #rank2, #rank3, #rank4, #rank5, #sort').on('change', collectList);

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
    const $currCoverBox = $('.cover-wrapper-inner.curr > .cover-box');
    const currCoverBoxWidth = $currCoverBox.width();
    const calcWidth = (coverWrapperWidth - currCoverBoxWidth - 20) / 2;
    const $sideCover = $('.cover-wrapper-inner.prev > .cover-box, .cover-wrapper-inner.next > .cover-box');
    $sideCover.toggle(currCoverBoxWidth / 2 < calcWidth);
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
						<main>
            ${histories.map((history) => `<div class="history-item"><label>${total--}</label><label>${history.action}</label><label>${history.date}</label></div>`)}
						</main>
						<script>
						document.addEventListener("DOMContentLoaded", function() {
							setTimeout(() => {
								window.resizeTo(400, document.body.querySelector("body > main").scrollHeight + 68 + 16 + 300);
							}, 500);
						});
						</script>
					</body>
				</html>`;
      // console.debug('history', histories, html);
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
  $('.actress-wrapper').on('click', '.info-actress-name', function () {
    var actress = $(this).closest('.info-actress').data('actress');
    if (actress.name != 'Amateur') View.actress(actress.name);
  });
  // actress favorite click
  $('.actress-wrapper').on('click', '.info-actress-favorite i.fa', function () {
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
    grapChannel.postMessage(currentFlay.opus);
  });
  // like-btn: 좋아요 하루 1번
  $('.like-btn').on('click', () => {
    if (currentFlay.video.likes === null) {
      currentFlay.video.likes = [];
    }

    const yyyyMMdd = new Date().format('yyyy-MM-dd');
    const todayLikeCount = currentFlay.video.likes.filter((like) => like.substring(0, 10) === yyyyMMdd).length;

    if (todayLikeCount === 0) {
      currentFlay.video.likes.push(new Date());
      Rest.Video.update(currentFlay.video);
    }
  });
  // control video stream
  $('.cover-wrapper-inner.curr > .cover-box').on('click', Flaying.start);
  $('.cover-wrapper-inner.curr > .cover-box > #btnVideoClose').on('click', Flaying.stop);
  // rename flay
  $('#file-wrapper .file-wrapper-rename input').on('keyup', (e) => {
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
  $('#sort').val(sort);
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

    // initialize Tag
    $('.tag-list > label:not(.label-add-tag)').remove();
    $('.tag-list').prepend(tagList.sort((t1, t2) => t1.name.localeCompare(t2.name)).map((tag) => createTag(tag)));

    tagList.forEach((tag) => {
      const descArray = tag.description?.split(',').map((desc) => {
        if (desc.trim() !== '') {
          return desc.trim();
        }
        return;
      });
      const tagHints = [tag.name, ...descArray];
      tagMap.set(tag.id, tagHints);
    });

    // initialize Actress
    mapNameActress = actressList.reduce((map, actress) => {
      map.set(actress.name, actress);
      return map;
    }, new Map());

    $('#pageContent').trigger('collect');
    $(window).trigger('resize');
  });

  SessionStorageItem.clear();
}

function collectList() {
  const compareTo = (data1, data2) => {
    var result = 0;
    if (data1 === null && data2 === null) {
      result = 0;
    } else if (data1 !== null && data2 === null) {
      result = 1;
    } else if (data1 === null && data2 !== null) {
      result = -1;
    } else if (typeof data1 === 'number') {
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
      const actress = mapNameActress.get(actressName);
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
  const sort = $('#sort').val();
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
  history = { on: false, list: [], pointer: -1 };
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
      // matched = flay.files.movie.length > 0 || flay.files.subtitles.length > 0;
      matched = true;
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
      // studio
      case 'S': {
        const sVal = compareTo(flay1.studio, flay2.studio);
        return sVal === 0 ? compareTo(flay1.opus, flay2.opus) : sVal;
      }
      // opus
      case 'O':
        return compareTo(flay1.opus, flay2.opus);
      // title
      case 'T':
        return compareTo(flay1.title, flay2.title);
      // actress
      case 'A': {
        let aVal = compareTo(flay1.actressList, flay2.actressList);
        aVal = aVal === 0 ? compareTo(flay1.release, flay2.release) : aVal;
        return aVal === 0 ? compareTo(flay1.opus, flay2.opus) : aVal;
      }
      // release
      case 'R': {
        const rVal = compareTo(flay1.release, flay2.release);
        return rVal === 0 ? compareTo(flay1.opus, flay2.opus) : rVal;
      }
      // lastModified
      case 'M':
        return compareTo(flay1.lastModified, flay2.lastModified);
      // Last Access & Modified
      case 'la':
        return compareTo(Math.max(flay1.video.lastPlay, flay1.video.lastAccess, flay1.lastModified), Math.max(flay2.video.lastPlay, flay2.video.lastAccess, flay2.lastModified));
      // Play Count
      case 'PC': {
        const pVal = compareTo(flay1.video.play, flay2.video.play);
        return pVal === 0 ? compareTo(flay1.release, flay2.release) : pVal;
      }
      // Last Played Date
      case 'LP': {
        const pVal = compareTo(flay1.video.lastPlay, flay2.video.lastPlay);
        return pVal === 0 ? compareTo(flay1.release, flay2.release) : pVal;
      }
      // Like
      case 'L': {
        const pVal = compareTo(flay1.video.likes ? flay1.video.likes.length : 0, flay2.video.likes ? flay2.video.likes.length : 0);
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
  const currentMapStudioCount = new Map();
  const currentMapActressCount = new Map();
  let count = 1;
  for (const flay of collectedList) {
    // flay.studio
    if (currentMapStudioCount.has(flay.studio)) {
      count = currentMapStudioCount.get(flay.studio);
      count++;
    } else {
      count = 1;
    }
    currentMapStudioCount.set(flay.studio, count);

    // flay.actressList
    for (const actressName of flay.actressList) {
      if (currentMapActressCount.has(actressName)) {
        count = currentMapActressCount.get(actressName);
        count++;
      } else {
        count = 1;
      }
      currentMapActressCount.set(actressName, count);
    }
  }

  // sort statistics map
  const currentAscMapStudioCount = new Map(
    [...currentMapStudioCount.entries()].sort((a, b) => {
      return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
    })
  );

  const currentAscMapActressCount = new Map(
    [...currentMapActressCount.entries()].sort((a, b) => {
      return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
    })
  );

  const minCount = $("input[name='source']:checked").val() === 'Low' ? 1 : 5;
  $('#statisticsStudio')
    .empty()
    .append(
      $('<label>', { class: 'text hover text-info me-2' }).append(
        $('<span>')
          .html('Show All')
          .on('click', function () {
            $('#statisticsStudio .studioTag.hide').toggle();
            $(this).html($('#statisticsStudio .studioTag.hide:visible').length > 0 ? minCount + ' over' : 'Show All');
          })
      )
    );
  for (const [studioName, count] of currentAscMapStudioCount) {
    $('#statisticsStudio').append(
      $(`<label class="text sm hover studioTag ${count < minCount ? 'hide' : ''}">
					<span>${studioName}</span><i class="badge">${count}</i>
				</label>`).data('name', studioName)
    );
  }
  $('#statisticsStudio .studioTag').on('click', (e) => {
    $('#search').val($(e.target).closest('label.studioTag').data('name'));
    $('#pageContent').trigger('collect');
  });
  $('#statisticsStudio > label:first-child').toggle(minCount > 1);

  $('#statisticsActress')
    .empty()
    .append(
      $('<label>', { class: 'text hover text-info me-2' }).append(
        $('<span>')
          .html('Show All')
          .on('click', function () {
            $('#statisticsActress .actressTag.hide').toggle();
            $(this).html($('#statisticsActress .actressTag.hide:visible').length > 0 ? minCount + ' over' : 'Show All');
          })
      )
    );
  for (const [actressName, count] of currentAscMapActressCount) {
    const a = mapNameActress.get(actressName);
    $('#statisticsActress').append(
      $(`<label class="text sm hover actressTag ${count < minCount ? 'hide' : ''}">
					<span>${actressName}</span><i class="badge">${count}</i>
				</label>`).data('name', actressName)
    );
  }
  $('#statisticsActress .actressTag').on('click', (e) => {
    $('#search').val($(e.target).closest('label.actressTag').data('name'));
    $('#pageContent').trigger('collect');
  });
  $('#statisticsActress > label:first-child').toggle(minCount > 1);
}

function showVideo(args) {
  function setCoverAsBackground(selector, opus, callback) {
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
  }
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

  navigation.off();

  Promise.all([
    // actress
    new Promise((resolve, reject) => {
      $('.actress-wrapper').empty();
      currentFlay.actressList.forEach((name) => {
        if (name === 'Amateur') {
          return;
        }

        const actress = mapNameActress.get(name);
        if (actress === null) {
          throw 'not found actress: ' + name;
        }

        let nowAge = Util.Actress.getAgeNumber(actress);
        let thatAge = Util.Actress.getAgeNumber(actress, currentFlay.release.substring(0, 4));
        let ageExpr = Util.Actress.getAge(actress);
        if (nowAge !== thatAge) {
          ageExpr = `${thatAge}<small>/${ageExpr}<small>`;
        }

        const $actress = $('<div>', { class: 'info-actress' })
          .data('actress', actress)
          .append(
            $('<label>', { class: 'text info-actress-favorite hover' }).append($('<i>', { class: 'fa ' + (actress.favorite ? 'favorite fa-heart' : 'fa-heart-o') }).css('min-width', 16)),
            $('<label>', { class: 'text info-actress-name hover', title: actress.comment }).html(name),
            $('<label>', { class: 'text info-actress-local' }).html(actress.localName),
            $('<label>', { class: 'text info-actress-flaycount' }).html('&nbsp;').neonLoading(true),
            $('<label>', { class: 'text info-actress-avgrank' }).html('&nbsp;').neonLoading(true),
            $('<label>', { class: 'text info-actress-age' }).html(ageExpr),
            $('<label>', { class: 'text info-actress-birth' }).html(Util.Actress.getBirth(actress)),
            $('<label>', { class: 'text info-actress-body' }).html(Util.Actress.getBody(actress)),
            $('<label>', { class: 'text info-actress-height' }).html(Util.Actress.getHeight(actress)),
            $('<label>', { class: 'text info-actress-debut' }).html(Util.Actress.getDebut(actress))
          )
          .appendTo($('.actress-wrapper'));

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
    // history chart
    new Promise((resolve, reject) => {
      Rest.History.find(currentFlay.opus, (histories) => {
        const playHistories = histories.filter((history) => history.action === 'PLAY');
        if (playHistories.length > 0) {
          // 화면 밖으로 밀려나갈거 같으면 차트 가리기
          const canVisible = window.innerHeight > $('.tag-wrapper').position().top + $('.tag-wrapper').height() + 100;
          if (canVisible) {
            drawGraph(playHistories);
          }
          $('#chartdiv').toggle(canVisible);
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
          $('#chartdiv').hide();
          resolve(true);
        }
      });
    }),
    // score
    new Promise((resolve, reject) => {
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

  // show Infomation
  // studio
  $('.info-studio').html(currentFlay.studio);
  // opus
  $('.info-opus').html(currentFlay.opus);
  // title
  $('.info-title').html(currentFlay.title);
  // release
  $('.info-release').html(currentFlay.release);
  // modified, lastAccess, lastPlay
  $('.info-lastModified').html(DateUtils.format('yy/MM/dd', currentFlay.lastModified));
  $('.info-lastAccess').html(DateUtils.format('yy/MM/dd', currentFlay.video.lastAccess));
  $('.info-lastPlay').html(DateUtils.format('yy/MM/dd', currentFlay.video.lastPlay));
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
  // tag cadidates
  $('#videoTags input').removeClass('tag-candidate');
  tagMap.forEach((value, key) => {
    for (const hint of value) {
      if (currentFlay.title.includes(hint)) {
        if (!$('[data-tag-id="' + key + '"]').is(':checked')) {
          $('[data-tag-id="' + key + '"]').addClass('tag-candidate');
        }
        break;
      }
    }
  });

  // files
  $('#file-wrapper > div > div:not(.file-wrapper-rename)').empty();
  currentFlay.files.cover.forEach((file) => {
    $('.file-wrapper-cover').append(
      $('<label>', { class: 'text sm w-100' }).append(
        $('<span>', { class: 'hover', title: 'Open folder' })
          .html(file)
          .on('click', () => {
            Rest.Flay.openFolder(file);
          }),
        $('<span>', { class: 'text-transparent ms-2 float-end' }).html('<i class="fa fa-circle"></i>')
      )
    );
  });
  currentFlay.files.movie.forEach((file) => {
    $('.file-wrapper-movie').append(
      $('<label>', { class: 'text sm w-100' }).append(
        $('<span>', { class: 'hover', title: 'Open folder' })
          .html(file)
          .on('click', () => {
            Rest.Flay.openFolder(file);
          }),
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
        $('<span>', { class: 'hover', title: 'Open folder' })
          .html(file)
          .on('click', () => {
            Rest.Flay.openFolder(file);
          }),
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
  // toggle original title, desc
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

  // mark Like
  console.debug('likes', currentFlay.video.likes, currentFlay.video.likes?.length);
  const likeCount = currentFlay.video.likes?.length;
  $('.like-btn').attr('title', `like ${likeCount > 0 ? likeCount : ''}`);

  const yyyyMMdd = new Date().format('yyyy-MM-dd');
  const todayLikeCount = currentFlay.video.likes?.filter((like) => like.substring(0, 10) === yyyyMMdd).length;
  $('.like-btn').toggleClass('thumbs-up', todayLikeCount > 0);
}

function notice(msg) {
  $('.notice-bar').html($(`<label class="text sm">${msg}</label>`).fadeOut(5000));
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
    .removeClass('text-danger')
    .each(function () {
      const $this = $(this);
      const name = $this.find('span').text();
      currentFlay.video.tags.forEach((tag) => {
        if (name.indexOf(tag.name) > -1) {
          $this.addClass('text-danger');
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

function drawGraph(historyList) {
  // console.table(historyList);
  // init variables
  releaseForChart = currentFlay.release.substring(0, 7).replace(/\./gi, '-');
  playMaxForChart = 0;

  const dataMap = new Map();
  dataMap.set(releaseForChart, 0.2);
  historyList.forEach((history) => {
    const key = history.date.substring(0, 7);
    let val = 0;
    if (dataMap.has(key)) {
      val = dataMap.get(key);
    }
    dataMap.set(key, ++val);
  });
  // console.log(dataMap);

  // convert map to array
  const playedDate = ['x'];
  const playCount = ['play'];
  dataMap.forEach((val) => {
    playMaxForChart = Math.max(playMaxForChart, val);
  });
  playMaxForChart = Math.floor(playMaxForChart);
  // console.log('playNax', playMax);
  dataMap.forEach((val, key) => {
    playedDate.push(key);
    playCount.push([playMaxForChart, val]);
  });

  chart.load({
    columns: [playedDate, playCount],
  });
}

function initChart() {
  chart = bb.generate({
    data: {
      x: 'x',
      xFormat: '%Y-%m',
      columns: [['x'], ['play']],
      type: bubble(),
      color: function (color, d) {
        if (DateUtils.format('yyyy-MM', d.x) == releaseForChart) {
          return '#fd7e14';
        } else {
          return color;
        }
      },
    },
    bubble: {
      maxR: 8,
    },
    axis: {
      x: {
        min: startAxisForChart,
        max: endAxisForChart,
        type: 'timeseries',
        tick: {
          format: '%y.%m',
        },
      },
      y: {
        min: 0,
        max: playMaxForChart * 2,
        show: false,
        tick: {
          show: false,
          text: {
            show: false,
          },
        },
      },
    },
    legend: {
      show: false,
    },
    bindto: '#chartdiv',
  });
}

attachPageEventListener();
attachFlayEventListener();
initCondition();
initChart();
loadData();

window.emitFlay = (flay) => {
  console.log('received flay', flay);
};
window.emitStudio = (studio) => {
  console.log('received studio', studio);
};
window.emitVideo = (video) => {
  console.log('received video', video);
  for (let flay of flayList) {
    if (flay.opus === video.opus) {
      flay.video = video;
      break;
    }
  }
  for (let flay of collectedList) {
    if (flay.opus === video.opus) {
      flay.video = video;
      break;
    }
  }
  if (currentFlay.opus === video.opus) {
    currentFlay.video = video;
  }
  showVideo();
};
window.emitActress = (actress) => {
  console.log('received actress', actress);
};
window.emitTag = (tag) => {
  console.log('received tag', tag);
};
window.emitMesssage = (message) => {
  console.log('received message', message);
};
