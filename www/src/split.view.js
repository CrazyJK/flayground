import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import './split.view.scss';

const colHtml = $('.row').html();

let siteCount = 0;

const getSite = () => {
  const $site = $(colHtml.replace(/ifrm/g, 'ifrm' + ++siteCount));
  $site.find('.control-btn').draggable();
  return $site;
};

// control event
$('#splitWrapper')
  .on('click', '.control-btn .fa.fa-expand', function () {
    // max site
    let $site = $(this).parents('.site');
    $site.addClass('full-screen').find('.video-wrap').css({
      height: window.innerHeight,
    });
    $site.find('.fa-compress').removeClass('hide');
    $(this).addClass('hide');
  })
  .on('click', '.control-btn .fa.fa-compress', function () {
    // normal site
    let $site = $(this).parents('.site');
    $site.removeClass('full-screen').find('.fa-expand').removeClass('hide');
    $(window).trigger('resize');
    $(this).addClass('hide');
  })
  .on('click', '.control-btn .fa.fa-arrow-up', function () {
    // size y smaller
    let rowCount = $('#splitWrapper > div.row').length;
    let $row = $(this).parents('.row');
    if (rowCount === 0) {
      $row.attr('data-y', 0);
    } else {
      $row.attr('data-y', parseInt($row.attr('data-y')) - 50);
    }
    $(window).trigger('resize');
  })
  .on('click', '.control-btn .fa.fa-arrow-down', function () {
    // size y enlarge
    let rowCount = $('#splitWrapper > div.row').length;
    let $row = $(this).parents('.row');
    if (rowCount === 0) {
      $row.attr('data-y', 0);
    } else {
      $row.attr('data-y', parseInt($row.attr('data-y')) + 50);
    }
    $(window).trigger('resize');
  })
  .on('click', '.control-btn .fa.fa-arrow-left', function () {
    // size x samller
    let $colWrap = $(this).parents('.row');
    let colCount = $colWrap.children().length;
    console.log('colCount', colCount);
    if (colCount === 1) {
      return;
    }
    let $site = $(this).parents('.site');
    let colClass = $site.attr('class').replace(/site/g, '').trim();
    console.log('colClass', colClass);
    let _part = colClass.split('-');
    if (_part.length > 1) {
      let newColClass = _part[0] + '-' + (parseInt(_part[1]) - 1);
      console.log('newColClass', newColClass);
      $site.removeClass(colClass).addClass(newColClass);
    } else {
      console.log('first left click');
      $site.removeClass('col').addClass('col-' + (12 / colCount - 1));
    }
  })
  .on('click', '.control-btn .fa.fa-arrow-right', function () {
    // size x enlarge
    let $colWrap = $(this).parents('.row');
    let colCount = $colWrap.children().length;
    if (colCount === 1) {
      return;
    }
    let $site = $(this).parents('.site');
    let colClass = $site.attr('class').replace(/site/g, '').trim();
    let _part = colClass.split('-');
    if (_part.length > 1) {
      let newColClass = _part[0] + '-' + (parseInt(_part[1]) + 1);
      $site.removeClass(colClass).addClass(newColClass);
    } else {
      $site.removeClass('col').addClass('col-' + (12 / colCount + 1));
    }
  })
  .on('click', '.control-btn .fa-circle', function () {
    // size original
    let $site = $(this).parents('.site');
    let colClass = $site.attr('class').replace(/site/g, '').trim();
    $site.removeClass(colClass).addClass('col');
  })
  .on('click', '.control-btn .fa.fa-plus', function () {
    // scale up
    let $site = $(this).parents('.site');
    let scaleArgs = parseFloat($site.attr('data-scale'));
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
    let $site = $(this).parents('.site');
    let scaleArgs = parseFloat($site.attr('data-scale'));
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
    let $site = $(this).parents('.site');
    let srcUrl = $site.find('iframe').attr('src');
    window.open(srcUrl, new Date().getTime(), 'width=' + 540 + ',height=' + 997);
  })
  .on('click', '.control-btn .fa.fa-download.rotate', function () {
    // add site
    $(this).parents('.row').append(getSite());
    $(window).trigger('resize');
  })
  .on('click', '.control-btn .fa.fa-download:not(.rotate)', function () {
    // add row
    let $wrp = $('#splitWrapper');
    let $row = $(this).parents('.row');
    let $newRow = $row.clone().empty();
    $wrp.append($newRow.append(getSite()));
    $(window).trigger('resize');
  })
  .on('click', '.control-btn .fa.fa-undo', function (e) {
    // restore position
    $(this).parents('.control-btn').removeAttr('style');
  })
  .on('click', '.control-btn .fa.fa-trash-o', function () {
    // remove site
    let $row = $(this).parents('.row');
    let $site = $(this).parents('.site');
    if ($row.children().length > 1) {
      $site.remove();
    } else {
      $row.remove();
    }
    $(window).trigger('resize');
  })
  .on('click', '.address-bar .ico-site', (e) => {
    // go site
    const $site = $(e.target).parents('.site');
    $site.find('.ico-site').removeClass('active');
    $site.find('iframe').attr('src', $(e.target).attr('data-url'));
    $(e.target).addClass('active');
  })
  .on('keyup', '.input-address', (e) => {
    // input url
    if (e.key === 'Enter') {
      const $site = $(e.target).parents('.site');
      $site.find('.ico-site').removeClass('active');
      $site.find('iframe').attr('src', $(e.target).val());
    }
  })
  .on('click', '#btnReloadSite', (e) => {
    // current reload
    const $site = $(e.target).closest('.site');
    const url = $site.find('.input-address').val().trim();
    if (url !== '') {
      $site.find('iframe').attr('src', url);
    }
  });

// grid mode event
$('#gridModeWrap > .fa').on('click', function () {
  const gridMode = $(this).attr('data-grid');
  const row = parseInt(gridMode.charAt(0));
  const col = parseInt(gridMode.charAt(2));
  const $splitWrapper = $('#splitWrapper').empty();
  for (let r = 0; r < row; r++) {
    const $row = $('<div>', { class: 'row', 'data-y': '0' }).appendTo($splitWrapper);
    for (let c = 0; c < col; c++) {
      $row.append(getSite());
    }
  }
  $(window).trigger('resize');
});

function translateSite(obj, direction) {
  const $site = $(obj).parents('.site');
  const scaleArgs = parseFloat($site.attr('data-scale'));
  const transArgs = $site.attr('data-trans');
  if (scaleArgs > 0) {
    const transArgsArr = transArgs.split(',');
    let transArgsX = parseInt(transArgsArr[0]) + (direction === 'left' ? -5 : direction === 'right' ? 5 : 0);
    let transArgsY = parseInt(transArgsArr[1]) + (direction === 'up' ? -5 : direction === 'down' ? 5 : 0);
    if (direction === 'center') {
      transArgsX = 0;
      transArgsY = 0;
    }
    $site
      .attr('data-trans', transArgsX + ',' + transArgsY)
      .find('iframe')
      .css({
        transform: `scale(${scaleArgs}) translate(${String(transArgsX)}%, ${String(transArgsY)}%)`,
      });
  }
}

$(window)
  .on('resize', () => {
    $('div.row').each((idx, row) => {
      $(row)
        .find('.video-wrap')
        .css({
          height: window.innerHeight / $('.row:not(:empty)').length + parseInt($(row).attr('data-y')) - 2,
        });
    });
  })
  .trigger('resize');

// set draggable
$('#splitWrapper').find('.control-btn').draggable();
