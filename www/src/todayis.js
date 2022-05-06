import $ from 'jquery';
import { system, WINDOWS, File } from './lib/crazy.common.js';
import { Rest } from './lib/flay.rest.service.js';
import './todayis.scss';

let Todayis = {
  list: [],
  toggledFolderIndex: [],
  sortTodayis: () => {
    const compare = function (d1, d2) {
      if (typeof d1 === 'number') {
        return d1 - d2;
      } else if (typeof d1 === 'string') {
        return d1.toLowerCase().localeCompare(d2.toLowerCase());
      } else {
        return d1 > d2 ? 1 : -1;
      }
    };

    const sort = $("input[name='sort']:checked").val();
    Todayis.list.sort(function (t1, t2) {
      var c1 = compare(t2.path, t1.path);
      switch (sort) {
        case 'T':
          return c1 === 0 ? compare(t1.name, t2.name) : c1;
        case 'L':
          return c1 === 0 ? compare(t1.length, t2.length) : c1;
        case 'M':
          return c1 === 0 ? compare(t1.lastModified, t2.lastModified) : c1;
      }
    });
  },
  addEvent: () => {
    $('#sorting > label > input').on('change', () => {
      Todayis.sortTodayis();
      Todayis.renderTodayis();
    });

    $('#videoWrapper').on('wheel', (e) => {
      console.log('wheel', e);
      e.stopPropagation();
      const video = $('#videoWrapper video').get(0);
      const videoSeekTime = 10;
      if (e.originalEvent.wheelDelta < 0) {
        video.currentTime += videoSeekTime;
      } else {
        video.currentTime -= videoSeekTime;
      }
    });

    $('#videoWrapper span.stop').on('click', (e) => {
      console.log('stop click', e.target);
      $('#videoWrapper video').get(0).pause();
      $('#videoWrapper').hide();
    });

    $(window)
      .on('resize', () => {
        $('#folderWrapper').height(window.innerHeight - $('#topMenu').height());
      })
      .trigger('resize');
  },
  renderFolder: () => {
    const $folderWrapper = $('#folderWrapper').empty();
    let previousPath = '';
    let size = 0;
    let length = 0;
    let currendFolderIndex = 0;

    Todayis.sortTodayis();

    $.each(Todayis.list, (idx, todayis) => {
      if (todayis.path !== previousPath) {
        $('<div>', { class: 'folder', id: 'fidx' + currendFolderIndex })
          .data('folder-index', currendFolderIndex)
          .append(
            $('<div>', { class: 'folder-info' }).append(
              $('<span>')
                .html(todayis.path)
                .on('click', currendFolderIndex, (e) => {
                  $(e.target).closest('.folder').find('.folder-items').toggle();

                  if (Todayis.toggledFolderIndex.includes(e.data)) {
                    Todayis.toggledFolderIndex.splice(Todayis.toggledFolderIndex.indexOf(e.data), 1);
                  } else {
                    Todayis.toggledFolderIndex.push(e.data);
                  }
                  console.log(`folder toggle index=${e.data}`, e.target, Todayis.toggledFolderIndex);
                }),
              $('<span>', { class: 'ml-3 toggle-folder' }).append(
                $('<i>', { class: 'fa fa-folder-open' }).on('click', todayis, (e) => {
                  if (system === WINDOWS) {
                    Rest.Todayis.openFolder(e.data.path);
                  }
                })
              )
            ),
            $('<div>', { class: 'folder-items' })
          )
          .appendTo($folderWrapper);
        ++currendFolderIndex;
      }

      todayis['folderIndex'] = currendFolderIndex - 1;
      previousPath = todayis.path;
      size++;
      length += todayis.length;
    });

    $('#size').html(size + ' Movie');
    $('#length').html(File.formatSize(length));
  },
  renderTodayis: () => {
    $('.folder-items').empty();
    $.each(Todayis.list, (idx, todayis) => {
      $('#fidx' + todayis.folderIndex + ' > div.folder-items').append(
        $('<div>', { class: 'item', 'data-idx': idx }).append(
          $('<div>', { class: 'item-title' }).append(
            $('<span>', { class: 'text-title' })
              .on('click', todayis, function (e) {
                if (system === WINDOWS) {
                  Rest.Todayis.play(e.data, () => {
                    $(e.target).closest('.item').addClass('played');
                  });
                }
              })
              .html(todayis.name.slice(0, -4).replace(/\\-|[.]/gi, ' '))
          ),
          $('<div>', { class: 'item-info' }).append($('<span>', { class: 'text-modified' }).html(new Date(todayis.lastModified).format('yyyy-MM-dd')), $('<span>', { class: 'text-length' }).html(File.formatSize(todayis.length))),
          $('<div>', { class: 'item-action' }).append(
            $('<span>', { class: 'text-play' })
              .on('click', todayis, (e) => {
                console.log('play click', e.data.uuid);
                const newUrl = '/todayis/stream/' + e.data.uuid;
                const curUrl = $('#videoWrapper video').attr('src');
                if (newUrl !== curUrl) {
                  $('#videoWrapper video').attr({ src: newUrl });
                }
                $('#videoWrapper').show();
                $('#videoWrapper video').get(0).play();
                $(e.target).closest('.item').addClass('played');
              })
              .html('Play'),
            $('<a>', { class: ' text-suffix text-light', href: '/todayis/stream/' + todayis.uuid }).html(todayis.name.slice(todayis.name.length - 3, todayis.name.length)),
            $('<span>', { class: 'text-delete' })
              .on('click', todayis, function (e) {
                if (confirm('is delete this movie?\n' + e.data.name)) {
                  Rest.Todayis.delete(e.data, () => {
                    const idx = $(e.target).closest('.item').addClass('deleted').attr('data-idx');
                    Todayis.list.splice(parseInt(idx), 1);
                  });
                }
              })
              .html('Delete')
          )
        )
      );
    });
  },
  start: () => {
    $('#sorting > label:nth-child(3) > input').prop('checked', true);
    Rest.Todayis.list((list) => {
      Todayis.list = list;
      Todayis.addEvent();
      Todayis.renderFolder();
      Todayis.renderTodayis();
    });
  },
};

Todayis.start();
