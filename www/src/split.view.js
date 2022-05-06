import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import './split.view.scss';

var URL_POPKON = 'https://www.popkontv.com/live/favorite.asp?tabmenu=3';
var URL_PANDA = 'https://www.pandalive.co.kr/live#user';
var colHtml = '';
var colCount = 0;

$(window).on('resize', setHeight);

colHtml = $('.row').html();
setHeight();
addSplitControlEventListener();

function setHeight() {
  var rowCount = $('.row:not(:empty)').length;
  $('div.row').each(function (idx) {
    var $row = $(this);
    var y = parseInt($row.attr('data-y'));
    $row.find('.video-wrap').css({
      height: window.innerHeight / rowCount + y,
    });
  });
}

function addSplitControlEventListener() {
  function getColHtml() {
    return colHtml.replace(/ifrm/g, 'ifrm' + ++colCount);
  }
  // set draggable
  $('#splitWrapper').find('.control-btn').draggable();

  // control event
  $('#splitWrapper')
    .on('click', '.control-btn .fa.fa-expand', function () {
      // max site
      var $site = $(this).parents('.site');
      $site.addClass('full-screen').find('.video-wrap').css({
        height: window.innerHeight,
      });
      $site.find('.fa-compress').removeClass('hide');
      $(this).addClass('hide');
    })
    .on('click', '.control-btn .fa.fa-compress', function () {
      // normal site
      var $site = $(this).parents('.site');
      $site.removeClass('full-screen').find('.fa-expand').removeClass('hide');
      setHeight();
      $(this).addClass('hide');
    })
    .on('click', '.control-btn .fa.fa-arrow-up', function () {
      // size y smaller
      var rowCount = $('#splitWrapper > div.row').length;
      var $row = $(this).parents('.row');
      if (rowCount === 0) {
        $row.attr('data-y', 0);
      } else {
        $row.attr('data-y', parseInt($row.attr('data-y')) - 50);
      }
      setHeight();
    })
    .on('click', '.control-btn .fa.fa-arrow-down', function () {
      // size y enlarge
      var rowCount = $('#splitWrapper > div.row').length;
      var $row = $(this).parents('.row');
      if (rowCount === 0) {
        $row.attr('data-y', 0);
      } else {
        $row.attr('data-y', parseInt($row.attr('data-y')) + 50);
      }
      setHeight();
    })
    .on('click', '.control-btn .fa.fa-arrow-left', function () {
      // size x samller
      var $colWrap = $(this).parents('.row');
      var colCount = $colWrap.children().length;
      console.log('colCount', colCount);
      if (colCount === 1) {
        return;
      }
      var $site = $(this).parents('.site');
      var colClass = $site.attr('class').replace(/site/g, '').trim();
      console.log('colClass', colClass);
      var _part = colClass.split('-');
      if (_part.length > 1) {
        var newColClass = _part[0] + '-' + (parseInt(_part[1]) - 1);
        console.log('newColClass', newColClass);
        $site.removeClass(colClass).addClass(newColClass);
      } else {
        console.log('first left click');
        $site.removeClass('col').addClass('col-' + (12 / colCount - 1));
      }
    })
    .on('click', '.control-btn .fa.fa-arrow-right', function () {
      // size x enlarge
      var $colWrap = $(this).parents('.row');
      var colCount = $colWrap.children().length;
      if (colCount === 1) {
        return;
      }
      var $site = $(this).parents('.site');
      var colClass = $site.attr('class').replace(/site/g, '').trim();
      var _part = colClass.split('-');
      if (_part.length > 1) {
        var newColClass = _part[0] + '-' + (parseInt(_part[1]) + 1);
        $site.removeClass(colClass).addClass(newColClass);
      } else {
        $site.removeClass('col').addClass('col-' + (12 / colCount + 1));
      }
    })
    .on('click', '.control-btn .fa-circle', function () {
      // size original
      var $site = $(this).parents('.site');
      var colClass = $site.attr('class').replace(/site/g, '').trim();
      $site.removeClass(colClass).addClass('col');
    })
    .on('click', '.control-btn .fa.fa-plus', function () {
      // scale up
      var $site = $(this).parents('.site');
      var scaleArgs = parseFloat($site.attr('data-scale'));
      if (scaleArgs < 3) {
        scaleArgs = scaleArgs + 0.1;
        $site
          .attr('data-scale', scaleArgs)
          .find('iframe')
          .css({
            transform: 'scale(' + scaleArgs + ')',
          });
        $(this).attr('title', scaleArgs);
      }
    })
    .on('click', '.control-btn .fa.fa-minus', function () {
      // scale down
      var $site = $(this).parents('.site');
      var scaleArgs = parseFloat($site.attr('data-scale'));
      if (scaleArgs > 1) {
        scaleArgs = scaleArgs - 0.1;
        $site
          .attr('data-scale', scaleArgs)
          .find('iframe')
          .css({
            transform: 'scale(' + scaleArgs + ')',
          });
        $(this).attr('title', scaleArgs);
      }
    })
    .on('click', '.control-btn .fa-angle-double-up', function () {
      // scaled site move up
      translateSite(this, 'up');
    })
    .on('click', '.control-btn .fa-angle-double-right', function () {
      // scaled site move right
      translateSite(this, 'right');
    })
    .on('click', '.control-btn .fa-angle-double-down', function () {
      // scaled site move down
      translateSite(this, 'down');
    })
    .on('click', '.control-btn .fa-angle-double-left', function () {
      // scaled site move left
      translateSite(this, 'left');
    })
    .on('click', '.control-btn .fa-circle-o', function () {
      // scaled site move center
      translateSite(this, 'center');
    })
    .on('click', '.control-btn .fa.fa-clone', function () {
      // site popup
      var $site = $(this).parents('.site');
      var srcUrl = $site.find('iframe').attr('src');
      window.open(srcUrl, new Date().getTime(), 'width=' + 540 + ',height=' + 997 + ',toolbar=0,location=0,directories=0,titlebar=0,status=0,menubar=0,scrollbars=0,resizable=1');
    })
    .on('click', '.control-btn .fa.fa-download.rotate', function () {
      // add site
      var $row = $(this).parents('.row');
      var $newSite = $(getColHtml());
      $row.append($newSite);
      $newSite.find('.control-btn').draggable();
      setHeight();
    })
    .on('click', '.control-btn .fa.fa-download:not(.rotate)', function () {
      // add row
      var $wrp = $('#splitWrapper');
      var $row = $(this).parents('.row');
      var $newRow = $row.clone().empty();
      var $newSite = $(getColHtml());
      $wrp.append($newRow.append($newSite));
      $newSite.find('.control-btn').draggable();
      setHeight();
    })
    .on('click', '.control-btn .fa.fa-undo', function (e) {
      // restore position
      $(this).parents('.control-btn').removeAttr('style');
    })
    .on('click', '.control-btn .fa.fa-trash-o', function () {
      // remove site
      var $row = $(this).parents('.row');
      var $site = $(this).parents('.site');
      if ($row.children().length > 1) {
        $site.remove();
      } else {
        $row.remove();
      }
      setHeight();
    })
    .on('click', '.address-bar .ico-popkon', function () {
      // go popkontv.com
      var $site = $(this).parents('.site');
      $site.find('.ico-site').removeClass('active');
      $(this).addClass('active').parents('.site').find('iframe').attr('src', URL_POPKON);
    })
    .on('click', '.address-bar .ico-panda', function () {
      // go pandalive.co.kr
      var $site = $(this).parents('.site');
      $site.find('.ico-site').removeClass('active');
      $(this).addClass('active').parents('.site').find('iframe').attr('src', URL_PANDA);
    })
    .on('keyup', '.input-address', function (e) {
      // input url
      if (e.keyCode === 13) {
        var $site = $(this).parents('.site');
        $site.find('.ico-site').removeClass('active');
        $site.find('iframe').attr('src', $(this).val());
      }
    });

  // grid mode event
  $('#gridModeWrap > .fa').on('click', function () {
    const gridMode = $(this).attr('data-grid');
    var row = parseInt(gridMode.charAt(0));
    var col = parseInt(gridMode.charAt(2));
    var $splitWrapper = $('#splitWrapper').empty();
    for (var r = 0; r < row; r++) {
      var $row = $('<div>', { class: 'row', 'data-y': '0' }).appendTo($splitWrapper);
      for (var c = 0; c < col; c++) {
        $row.append($(getColHtml()));
      }
    }
    setHeight();
  });
}

function translateSite(obj, direction) {
  var $site = $(obj).parents('.site');
  var scaleArgs = parseFloat($site.attr('data-scale'));
  var transArgs = $site.attr('data-trans');
  if (scaleArgs > 0) {
    var transArgsArr = transArgs.split(',');
    var transArgsX = parseInt(transArgsArr[0]) + (direction === 'left' ? -5 : direction === 'right' ? 5 : 0);
    var transArgsY = parseInt(transArgsArr[1]) + (direction === 'up' ? -5 : direction === 'down' ? 5 : 0);
    if (direction === 'center') {
      transArgsX = 0;
      transArgsY = 0;
    }
    $site
      .attr('data-trans', transArgsX + ',' + transArgsY)
      .find('iframe')
      .css({
        transform: 'scale(' + scaleArgs + ') translate(' + String(transArgsX) + '%, ' + String(transArgsY) + '%)',
      });
  }
}

$('#btnReloadSite').on('click', (e) => {
  const $site = $(e.target).closest('.site');
  const url = $site.find('.input-address').val();
  if (url !== '') {
    $site.find('iframe').attr('src', url);
  }
});
