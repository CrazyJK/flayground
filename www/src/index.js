import '@fortawesome/fontawesome-free/js/all.js';
import $ from 'jquery';

import './index.scss';

import menuItems from './index.json';

// https://fontawesome.com/v6/search?o=r&m=free

const INDEX_POPUP_SIZE = 'index.popup.size';
const INDEX_MENO = 'index.memo';

// menu
menuItems.forEach((menu) => {
  $('#menuItemWrap').append(
    $('<h2>').append(
      $(`<a><i class="fas fa-location-arrow fa-flip-horizontal fa-xs me-2"></i></a>`).on('click', () => {
        window.open(menu.url, 'flayground' + menu.name, 'width=1000,height=1000');
      }),
      `<a href="${menu.url}">${menu.name}</a>`
    )
  );
});

// popup
function saveSize() {
  localStorage.setItem(INDEX_POPUP_SIZE, $w.val() + ',' + $h.val());
}
const popupWH = localStorage.getItem(INDEX_POPUP_SIZE)?.split(',') || [540, 997];
const $w = $('#w').val(popupWH[0]).on('change', saveSize);
const $h = $('#h').val(popupWH[1]).on('change', saveSize);
$('#b').on('click', () => {
  window.open($('#u').val(), Date.now(), 'width=' + $w.val() + ',height=' + $h.val());
});

// memo
$('#memo')
  .text(localStorage.getItem(INDEX_MENO))
  .on('change', (e) => {
    localStorage.setItem(INDEX_MENO, $(e.target).val());
  });
