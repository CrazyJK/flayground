import $ from 'jquery';
import { loading } from './flay.loading.js';
import { Rest, restCall } from './flay.rest.service.js';
import { Util, Search, View } from './flay.utils.js';
import { DateUtils } from './crazy.common.js';

let rankPoint = 0,
  playPoint = 0,
  subtitlesPoint = 0;
const flayMap = new Map();
const actressMap = new Map();

const idx = loading.on('Loading...');

Promise.all([
  new Promise((resolve, reject) => {
    Rest.Flay.list(resolve, reject);
  }),
  new Promise((resolve, reject) => {
    Rest.Archive.list(resolve, reject);
  }),
  new Promise((resolve, reject) => {
    restCall('/config', {}, resolve, reject);
  }),
  new Promise((resolve, reject) => {
    Rest.Actress.list(resolve, reject);
  }),
]).then(([instanceList, archiveList, config, actressList]) => {
  archiveList.forEach((flay) => {
    flayMap.set(flay.opus, flay);
  });
  instanceList.forEach((flay) => {
    flayMap.set(flay.opus, flay);
  });

  rankPoint = config.score.rankPoint;
  playPoint = config.score.playPoint;
  subtitlesPoint = config.score.subtitlesPoint;

  actressList.forEach((actress) => {
    actressMap.set(actress.name, actress);
  });

  loading.off(idx);
});

// show list by selected opus
$("input[name='favoriteOpus']").on('change', function (e) {
  if ($(this).attr('id') === 'favoriteOpusInput') {
    $(this).addClass('active');
    $("input[name='favoriteOpus']:checked").prop('checked', false);
  } else {
    $('#favoriteOpusInput').removeClass('active');
  }
  const favoriteOpus = $(this).val();
  if (favoriteOpus === '') {
    return;
  }

  const filteredOpusNumberList = Array.from(flayMap.keys())
    .filter((opus) => opus.startsWith(favoriteOpus))
    .sort((o1, o2) => o2.localeCompare(o1))
    .map((opus) => opus.replace(favoriteOpus + '-', ''));

  const maxNumber = filteredOpusNumberList[0];
  const minNumber = filteredOpusNumberList[filteredOpusNumberList.length - 1];

  const max = parseInt(maxNumber) + 5;
  const min = parseInt(minNumber);

  $('#flayView .f-body').empty();
  for (let i = max; i >= min; i--) {
    const composedOpusNumber = favoriteOpus + '-' + String(i).padStart(maxNumber.length, 0);
    let flay;
    if (flayMap.has(composedOpusNumber)) {
      flay = flayMap.get(composedOpusNumber);
    } else {
      flay = {
        opus: composedOpusNumber,
        notExists: true,
      };
    }
    $('#flayView .f-body').append(getFlayRecordObject(flay));
  }

  $('.flay-actress > span').hover(
    function (e) {
      const currName = $(this).text();
      $('.flay-actress > span').each(function () {
        $(this).toggleClass('same-name', $(this).text() === currName);
      });
    },
    function (e) {
      $('.flay-actress > span').removeClass('same-name');
    }
  );
});

function getFlayRecordObject(flay) {
  const calcScore = (flay) => {
    return flay.video?.rank * rankPoint + flay.video?.play * playPoint + (flay.files?.subtitles.length > 0 ? 1 : 0) * subtitlesPoint;
  };
  var actressObjectArray = Util.Actress.get(flay.actressList, 'mx-1').map(($actress) => {
    var name = $actress.text();
    var actress = actressMap.get(name);
    if (actress.favorite) {
      $actress.prepend(`<i class="fa fa-heart mr-1"><i>`);
    }
    return $actress;
  });

  return $('<div>', { id: flay.opus, class: `${flay.archive ? 'flay-archive' : 'flay-instance'} ${flay.notExists ? 'flay-not-exists' : 'flay-exists'}` })
    .append(
      $('<label>', { class: 'flay-opus' }).append(
        $('<span>', { class: 'hover' })
          .on('click', function () {
            if (flay.notExists) {
              Search.arzon(flay.opus);
              Search.avnori(flay.opus);
              Search.avdbs(flay.opus);
              Search.nextjav(flay.opus);
              Search.google(flay.opus);
              $(this).closest('.flay-opus').addClass('find-opus');
            } else {
              View.flay(flay.opus);
            }
          })
          .html(flay.opus)
      ),
      $('<label>', { class: 'flay-title nowrap' }).append(
        $('<span>', { class: 'hover' })
          .html(flay.title)
          .click(function (e) {
            $('#coverWrap > img').attr('src', '/static/cover/' + flay.opus);
            $('#coverWrap').show();
          })
      ),
      $('<label>', { class: 'flay-actress nowrap' }).append(actressObjectArray),
      $('<label>', { class: 'flay-release' }).append(flay.release),
      $('<label>', { class: 'flay-modified' }).append($.isEmptyObject(flay.lastModified) ? '' : DateUtils.format('yy/MM/dd', flay.lastModified)),
      $('<label>', { class: 'flay-rank' }).append(flay.video?.rank),
      $('<label>', { class: 'flay-play' }).append(flay.video?.play),
      $('<label>', { class: 'flay-movie' }).append(flay.files?.movie.length),
      $('<label>', { class: 'flay-subti' }).append(flay.files?.subtitles.length),
      $('<label>', { class: 'flay-score' }).append(calcScore(flay)),
      $('<label>', { class: 'flay-length' }).append($.isEmptyObject(flay.length) ? '' : File.formatSize(flay.length, 'GB'))
    )
    .on('click', function () {
      $(this).parent().children().removeClass('active');
      $(this).addClass('active');
    });
}
