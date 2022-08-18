/**
 * Flay actress rank
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'bootstrap/dist/js/bootstrap';
import './lib/crazy.jquery';
import './components/FlayMenu';
import './css/common.scss';
import './flay.actress2.scss';

import { Rest } from './lib/flay.rest.service';
import { PATH, DEFAULT_SPECS } from './lib/crazy.common';

var flayList = [];
var actressList = [];

$('.check-group input').on('change', showList);

Promise.all([new Promise((resolve) => Rest.Flay.list(resolve)), new Promise((resolve) => Rest.Actress.list(resolve))]).then((results) => {
  [flayList, actressList] = results;
  showList();
});

function showList() {
  var getActress = function (name) {
    for (var x in actressList) {
      if (actressList[x].name === name) {
        return actressList[x];
      }
    }
  };

  var fav = $('#fav').prop('checked');
  var noF = $('#noF').prop('checked');

  var rank0 = $('#rank0').prop('checked') ? '0' : '';
  var rank1 = $('#rank1').prop('checked') ? '1' : '';
  var rank2 = $('#rank2').prop('checked') ? '2' : '';
  var rank3 = $('#rank3').prop('checked') ? '3' : '';
  var rank4 = $('#rank4').prop('checked') ? '4' : '';
  var rank5 = $('#rank5').prop('checked') ? '5' : '';

  // filtering
  var collectedList = [];
  var rank = rank0 + rank1 + rank2 + rank3 + rank4 + rank5;
  for (const flay of flayList) {
    if (rank.indexOf(flay.video.rank) < 0) {
      continue;
    }
    collectedList.push(flay);
  }

  // sorting. descending release
  collectedList.sort(function (flay1, flay2) {
    return flay2.release.toLowerCase().localeCompare(flay1.release.toLowerCase());
  });

  // make actress map
  var actressMap = new Map();
  for (const flay of collectedList) {
    for (var actressName of flay.actressList) {
      var actress = getActress(actressName);
      var info = actressMap.get(actressName);
      if (!info) {
        info = {
          flayCount: 0,
          lastRelease: flay.release,
          favorite: actress.favorite,
          localName: actress.localName,
        };
        actressMap.set(actressName, info);
      }
      var count = info['flayCount'];
      info['flayCount'] = ++count;
    }
  }

  // show list
  var listNo = 1;
  var $goodActressList = $('#goodActressList').empty();
  for (let [key, value] of actressMap) {
    if ((!fav && !noF) || (!fav && noF && value.favorite) || (fav && !noF && !value.favorite)) {
      continue;
    }

    $goodActressList.append(
      $('<li>', { class: 'list-inline-item' })
        .append(
          $('<label>', { class: 'listNo' }).append(listNo++, '.'),
          $('<label>', { class: 'favorite' }).append(value.favorite ? "<i class='fa fa-heart'>" : ' '),
          $('<label>', { class: 'name hover' })
            .append(key)
            .on('click', () => {
              window.open(PATH + './info.actress.html?name=' + key, 'actress-info', 'width=1072,height=1800,' + DEFAULT_SPECS);
            }),
          $('<label>', { class: 'flayCount' }).append(value.flayCount),
          $('<label>', { class: 'localName' }).append(value.localName),
          $('<label>', { class: 'lastRelease' }).append(value.lastRelease)
        )
        .on('click', function () {
          $(this).addClass('active');
        })
    );
  }
}
