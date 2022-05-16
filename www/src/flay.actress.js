import $ from 'jquery';
import { Rest } from './lib/flay.rest.service';
import { Util, View } from './lib/flay.utils';
import { Random, Popup } from './lib/crazy.common';
import './flay.actress.scss';

var $actressTemplete = $('.actress');
var actressList;
var $actressList = $('.actress-list');
var sortKey = '',
  sortOrder = 1;

$('form').on('submit', function (e) {
  e.preventDefault();
});

$('#topMenu input').on('change', displayActress);
$('#search').on('keyup', (e) => {
  e.stopPropagation();
  if (e.key === 'Control') {
    return;
  }
  console.log('ctrlKey', e.ctrlKey, e.key);
  if ($(e.target).val().length > 2) {
    displayActress();
  }
});
$('.btn-reload').on('click', actressLoad);

$('#nameCheckBtn').on('click', function () {
  var limit = $('#limit').val();
  Rest.Actress.nameCheck(limit, displayNameCheckResult);
});

$('thead th.hover').on('click', function () {
  var prevSortKey = $(this).data('sort-key');
  if (prevSortKey) {
    sortOrder = sortKey === prevSortKey ? sortOrder * -1 : 1;
    sortKey = prevSortKey;
    displayActress();
    $('thead th.hover').removeClass('sorted asc desc');
    $(this).addClass('sorted ' + (sortOrder === 1 ? 'asc' : 'desc'));
  }
});

function actressLoad() {
  Rest.Actress.list(function (list) {
    actressList = list;

    actressList.sort(function (a1, a2) {
      return a1.name.toLowerCase().localeCompare(a2.name);
    });

    displayActress();
  });
}

function displayActress() {
  var fav = $('#favorite').prop('checked');
  var noFav = $('#noFavorite').prop('checked');
  var query = $('#search').val().toLowerCase();
  var viewType = $("input[name='viewType']:checked").val();
  var compareActressInfo = function (data1, data2, order) {
    if (typeof data1 === 'string') {
      if (data1 === '' && data2 === '') return 0;
      else if (data1 === '' && data2 != '') return 1;
      else if (data1 != '' && data2 === '') return -1;
      else return data1.toLowerCase().localeCompare(data2.toLowerCase()) * order;
    } else if (typeof data1 === 'number') {
      if (data1 === 0 && data2 === 0) return 0;
      else if (data1 === 0 && data2 > 0) return 1;
      else if (data1 > 0 && data2 === 0) return -1;
      else return data1 === data2 ? 0 : (data1 > data2 ? 1 : -1) * order;
    } else if (typeof data1 === 'boolean') {
      return data1 && data2 ? 0 : (data1 && !data2 ? 1 : -1) * order;
    } else {
      return (data1 > data2 ? 1 : -1) * order;
    }
  };
  console.log('displayActress', query, fav, noFav, viewType);

  const collectedList = actressList
    .filter((actress) => {
      let found = false;
      if (fav && actress.favorite) found = true;
      if (noFav && !actress.favorite) found = true;
      if (found && query != '') {
        var infotext = actress.name.toLowerCase() + actress.localName + actress.birth + actress.debut + actress.body + actress.height;
        found = infotext.indexOf(query) > -1;
      }
      return found;
    })
    .sort((a1, a2) => {
      switch (sortKey) {
        case 'fav':
          return compareActressInfo(a1.favorite, a2.favorite, sortOrder);
        case 'pic':
          return compareActressInfo(a1.coverSize, a2.coverSize, sortOrder);
        case 'name':
          return compareActressInfo(a1.name, a2.name, sortOrder);
        case 'local':
          return compareActressInfo(a1.localName, a2.localName, sortOrder);
        case 'birth':
        case 'age':
          return compareActressInfo(a1.birth, a2.birth, sortOrder);
        case 'body':
          return compareActressInfo(Util.Actress.getCup(a1), Util.Actress.getCup(a2), sortOrder);
        case 'height':
          return compareActressInfo(a1.height, a2.height, sortOrder);
        case 'debut':
          return compareActressInfo(a1.debut, a2.debut, sortOrder);
        default:
          return 1;
      }
    });
  $('#totalCount').html('Actress ' + collectedList.length);

  $actressList.empty();
  if (viewType === 'c') {
    $('#cardViewWrapper').show();
    $('#tableViewWrapper').hide();

    $.each(collectedList, function (idx, actress) {
      var $card = $actressTemplete.clone();
      $card.data('actress', actress);

      if (actress.coverSize > 0 && actress.name.length > 0) {
        $card.find('.card-body').css({
          backgroundImage: "url('/static/actress/" + actress.name + '/' + Random.getInteger(0, actress.coverSize - 1) + "')",
        });
      }

      $card
        .find('.card-title')
        .empty()
        .append(
          $('<label>', { class: 'text' }).append($('<i>', { class: 'fa fa-heart' + (actress.favorite ? ' favorite' : '-o') })),
          $('<label>', { class: 'text hover' })
            .html(actress.name)
            .on('click', function () {
              View.actress(actress.name);
            })
        );
      $card
        .find('.card-text')
        .empty()
        .append(
          $('<div>').append($('<label>', { class: 'text info-actress-extra' }).html(actress.localName)),
          $('<div>').append($('<label>', { class: 'text info-actress-extra' }).html(actress.birth)),
          $('<div>').append($('<label>', { class: 'text info-actress-extra' }).html(actress.body)),
          $('<div>').append($('<label>', { class: 'text info-actress-extra' }).append(Util.Actress.getAge(actress).ifNotZero()), $('<label>', { class: 'text info-actress-extra' }).html(actress.debut.ifNotZero()), $('<label>', { class: 'text info-actress-extra' }).html(actress.height.ifNotZero()))
        );
      if ($card.find('.card-text').text() == '') {
        $card.find('.card-text').empty();
      }
      $card.appendTo($actressList);
    });
  } else if (viewType === 't') {
    $('#cardViewWrapper').hide();
    $('#tableViewWrapper').show();

    $.each(collectedList, function (idx, actress) {
      $('<tr>')
        .append(
          $('<td>', { class: 'text-center' }).append($('<i>', { class: 'fa fa-heart' + (actress.favorite ? '' : '-o') })),
          $('<td>').html(actress.coverSize),
          $('<td>').append(
            $('<span>', { class: 'text hover' })
              .html(actress.name)
              .on('click', function () {
                View.actress(actress.name);
              })
          ),
          $('<td>').html(actress.localName),
          $('<td>').html(actress.birth),
          $('<td>').html(Util.Actress.getAge(actress).ifNotZero()),
          $('<td>').html(actress.body),
          $('<td>').html(actress.height.ifNotZero()),
          $('<td>').html(actress.debut.ifNotZero())
        )
        .appendTo($actressList);
    });
  } else {
    alert('unknown view type');
  }
}

function displayNameCheckResult(list) {
  var scoreToFixed = function (num) {
      return num.toFixed(3);
    },
    renderActressName = function (actress, right) {
      return $('<span>', { title: actress.name, class: 'hover' })
        .on('click', function () {
          View.actress(actress.name);
          $("[title='" + actress.name + "']").addClass('selected');
        })
        .hover(
          function () {
            $("[title='" + actress.name + "']").addClass('active');
          },
          function () {
            $("[title='" + actress.name + "']").removeClass('active');
          }
        )
        .append(right ? '' : actress.name.replace('혻', '_'), $('<label>').html(actress.localName), right ? actress.name.replace('혻', '_') : '');
    },
    sameLocalName = function (actress1, actress2) {
      return actress1.localName != '' && actress2.localName != '' && actress1.localName === actress2.localName ? 'same-localname' : 'normal';
    };

  $('#notice > p')
    .empty()
    .append(
      $('<table>', { class: 'table table-sm table-hover', id: 'nameCheckResultTable' }).append(
        $('<thead>').append($('<tr>').append($('<th>', { class: 'text-right' }).html('Name1'), $('<th>', { class: 'text-center' }).html('Score'), $('<th>').html('Name2'))),
        (function () {
          var tbody = $('<tbody>');
          $.each(list, function (idx, record) {
            $('<tr>', { class: sameLocalName(record.actress1, record.actress2) })
              .data('record', record)
              .append(
                $('<td>', { class: 'text-right' }).append(renderActressName(record.actress1, true)),
                $('<td>', { class: 'text-center' })
                  .html(record.score.toFixed(3))
                  .on('click', function () {
                    var record = $(this).parent().data('record');
                    Popup.open('/html/info/info.actress.compare.html?actress1=' + record.actress1.name + '&actress2=' + record.actress2.name, 'actressComparison', 1700, 800);
                    $(this).addClass('selected');
                  })
                  .addClass('hover'),
                $('<td>').append(renderActressName(record.actress2))
              )
              .appendTo(tbody);
          });
          return tbody;
        })()
      )
    );

  $('#notice').dialog({
    title: 'Name check result : ' + list.length,
    minWidth: 700,
    height: $(window).height() - 120,
  });
}

actressLoad();
