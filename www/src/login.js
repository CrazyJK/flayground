import $ from 'jquery';
import './login.scss';

$(window).on('keyup', function (e) {
  switch (e.keyCode) {
    case 13: // Enter
      $('#btnEnter').trigger('click');
      break;
    case 27: // Esc
      $('#title').trigger('click');
      break;
  }
});

$('#btnEnter').on('click', function () {
  $(this).hide();
  $('#signin').fadeIn(400);
  $("input[name='username']").focus();
});

$('#title').on('click', function () {
  $('#signin').hide();
  $('#btnEnter').fadeIn(400);
});

if (window.location.search.indexOf('error') > 0) {
  $('.display-middle').addClass('login-error');
  $('#btnEnter').trigger('click');
}

// set csrf
document.cookie.split(';').forEach((cookie) => {
  if ('XSRF-TOKEN' === cookie.substr(0, cookie.indexOf('=')).replace(/^\s+|\s+$/g, '')) {
    document.querySelector("input[name='_csrf']").value = unescape(cookie.substr(cookie.indexOf('=') + 1));
    return false;
  }
});
