import $ from 'jquery';
import './index.scss';
import menuItems from './index.menu.json';

const popupWidth = document.getElementById('popupWidth');
const popupHeight = document.getElementById('popupHeight');

$('input, button', '.popup-open-group').on('click keyup', function (e) {
  const url = $('.popup-open-group > input').val();
  $('.popup-open-group button').toggleClass('text-secondary', url === '');
  $('.popup-size-group.collapse').toggleClass('show', url !== '');
  if (url !== '') {
    const targetType = $(e.target).attr('type');
    if ((targetType === 'button' && e.type === 'click') || (targetType === 'search' && e.keyCode === 13)) {
      window.open(url, Date.now(), 'width=' + popupWidth.value + ',height=' + popupHeight.value + ',toolbar=0,location=0,directories=0,titlebar=0,status=0,menubar=0,scrollbars=0,resizable=1').focus();
    }
  }
});

const memoText = localStorage.getItem('index.memo');
$('#memo')
  .on('change', (e) => {
    localStorage.setItem('index.memo', $(e.target).val());
  })
  .text(memoText);

menuItems.forEach((menu) => {
  const $popupAnker = $('<a>').append('<i class="fas fa-location-arrow fa-flip-horizontal fa-xs mr-2"></i>');
  const $hrefAnker = $('<a>').html(menu.name);

  if (menu.method === 'both' || menu.method === 'popup') {
    $popupAnker.attr({ href: '#' }).on('click', function () {
      window.open(menu.url, 'flayground' + Date.now(), 'width=1000,height=1000,toolbar=0,location=0,directories=0,titlebar=0,status=0,menubar=0,scrollbars=1,resizable=1').focus();
    });
  }
  if (menu.method === 'both' || menu.method === 'href') {
    $hrefAnker.attr({ href: menu.url });
  }

  $('#menuItemWrap').append($('<h2>', { class: 'display-4' }).append($popupAnker, $hrefAnker));
});

$('a').addClass('chalk');

$('body > div').show();
