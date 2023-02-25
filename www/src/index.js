import '@fortawesome/fontawesome-free/js/all.js';
import $ from 'jquery';
import menuItems from './index.json';
import './index.scss';

// https://fontawesome.com/v6/search?o=r&m=free

const INDEX_POPUP_SIZE = 'index.popup.size';
const INDEX_MENO = 'index.memo';

// menu
menuItems.forEach((menu) => {
  $('#menuItemWrap').append(
    $('<h2>').append(
      $('<label>').append(
        $(`<a><i class="fas fa-location-arrow fa-flip-horizontal fa-xs me-2"></i></a>`).on('click', () => {
          window.open(menu.url, 'flayground' + menu.name, 'width=1000,height=1000');
        })
      ),
      $('<label>').append($(`<a href="${menu.url}">${menu.name}</a>`))
    )
  );
});

// popup
function saveSize() {
  localStorage.setItem(INDEX_POPUP_SIZE, $w.val() + ',' + $h.val());
}
function openPopup() {
  const url = $u.val().trim();
  if (url !== '') {
    window.open(url, Date.now(), 'width=' + $w.val() + ',height=' + $h.val());
  }
}
const [w, h] = localStorage.getItem(INDEX_POPUP_SIZE)?.split(',') || [540, 997];
const $w = $('#w').on('change', saveSize).val(w);
const $h = $('#h').on('change', saveSize).val(h);
const $b = $('#b').on('click', openPopup);
const $u = $('#u').on('keyup', (e) => {
  if (e.key === 'Enter') {
    openPopup();
  }
});

// memo
$('#memo')
  .text(localStorage.getItem(INDEX_MENO))
  .on('change', (e) => {
    localStorage.setItem(INDEX_MENO, $(e.target).val());
  });
