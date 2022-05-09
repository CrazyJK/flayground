import $ from 'jquery';
import { reqParam } from './lib/crazy.common.js';
import { Rest } from './lib/flay.rest.service.js';
import { STUDIO, ACTRESS_EXTRA, MODIFIED, RANK, COMMENT, FILEINFO } from './lib/flay.view.card.js';
import './css/common.scss';

const studioName = reqParam.s;

var $flayList = $('.flay-list');

$(window).on('resize', function () {
  $flayList.css({
    height: window.innerHeight - $('.navbar').outerHeight() - 16,
  });
});

$('#save').on('click', function () {
  Rest.Studio.update(
    {
      name: $('#name').val(),
      company: $('#company').val(),
      homepage: $('#homepage').val(),
    },
    function () {
      $('#save').html('Updated');
      setTimeout(function () {
        $('#save').html('Save');
      }, 1000);
    }
  );
});

Rest.Studio.get(
  studioName,
  function (studio) {
    document.title = studio.name + ' - ' + document.title;
    $('#name').val(studio.name);
    $('#company').val(studio.company);
    $('#homepage').val(studio.homepage);
  },
  function () {
    $('#name').val(studioName);
  }
);

Rest.Flay.find('studio/' + studioName, function (flayList) {
  $('.video-count').html(flayList.length);

  flayList.sort(function (flay1, flay2) {
    const c = flay2.release.toLowerCase().localeCompare(flay1.release);
    return c === 0 ? flay2.opus.toLowerCase().localeCompare(flay1.opus) : c;
  });

  $flayList.empty();

  $.each(flayList, function (idx, flay) {
    $flayList.appendFlayCard(flay, {
      width: 330,
      exclude: [STUDIO, ACTRESS_EXTRA, MODIFIED, RANK, COMMENT, FILEINFO],
      fontSize: '80%',
    });
  });

  $(window).trigger('resize');
});
