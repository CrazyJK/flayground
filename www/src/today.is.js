/**
 * today is
 */

import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';

import './components/FlayMenu';
import { File, system, WINDOWS } from './lib/crazy.common.js';
import './lib/crazy.jquery';
import { Rest } from './lib/flay.rest.service.js';

import './styles/common.scss';
import './today.is.scss';

let viewMode;
let sort;

Rest.Todayis.list((list) => {
  Todayis.list = list;
  render();
});

// START addEventListener
$('#viewMode, #sorting').on('change', render);
$('#toggleBtn').on('click', () => $('.folder-items').toggle(700));

$('#videoWrapper').on('wheel', (e) => {
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
  $('#videoWrapper video').get(0).pause();
  $('#videoWrapper').hide();
});
// END addEventListener

function render() {
  viewMode = $('#viewMode').val();
  sort = $('#sorting').val();

  Todayis.list.sort((t1, t2) => {
    const c1 = viewMode === 'F' ? compare(t1.path, t2.path) : 0;
    switch (sort) {
      case 'T':
        return c1 === 0 ? compare(t1.name, t2.name) : c1;
      case 'L':
        return c1 === 0 ? compare(t1.length, t2.length) : c1;
      case 'M':
        return c1 === 0 ? compare(t2.lastModified, t1.lastModified) : c1;
    }
  });

  if (viewMode === 'F') {
    Todayis.renderFolderTree();
  } else {
    Todayis.renderLastModified();
  }

  let size = 0;
  let length = 0;

  $.each(Todayis.list, (idx, todayis) => {
    size++;
    length += todayis.length;
  });

  $('#size').html(size + ' Movie');
  $('#length').html(File.formatSize(length));
}

const Todayis = {
  list: [],
  toggledFolderIndex: [],

  renderFolderTree: () => {
    const $folderWrapper = $('#folderWrapper').empty();
    let previousPath = '';
    let currendFolderIndex = 0;

    $.each(Todayis.list, (idx, todayis) => {
      if (todayis.path !== previousPath) {
        $('<div>', { class: 'folder', id: 'fidx' + currendFolderIndex })
          .data('folder-index', currendFolderIndex)
          .append(
            $('<div>', { class: 'folder-info' }).append(
              $('<span>')
                .html(todayis.path.split('\\').join('<small style="color:orange" class="mx-1">/</small>'))
                .on('click', currendFolderIndex, (e) => {
                  $(e.target).closest('.folder').find('.folder-items').toggle(700);

                  if (Todayis.toggledFolderIndex.includes(e.data)) {
                    Todayis.toggledFolderIndex.splice(Todayis.toggledFolderIndex.indexOf(e.data), 1);
                  } else {
                    Todayis.toggledFolderIndex.push(e.data);
                  }
                  console.log(`folder toggle index=${e.data}`, e.target, Todayis.toggledFolderIndex);
                }),
              $('<span>', { class: 'ms-3 toggle-folder' }).append(
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
    });

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
  renderLastModified: () => {
    const $folderWrapper = $('#folderWrapper').empty();
    const $ul = $('<ul>', { class: 'list-lastmodified' }).appendTo($folderWrapper);
    Array.from(Todayis.list).forEach((todayis) => {
      $ul.append(
        $('<li>', { class: 'item' }).append(
          `<label class="li-item-date">${new Date(todayis.lastModified).format('yyyy-MM-dd')}</label>`,
          `<label class="li-item-size">${File.formatSize(todayis.length)}</label>`,
          $(`<label class="li-item-path" title="${todayis.path}"><i class="fa fa-folder-open"></i></label>`).on('click', todayis, (e) => {
            if (system === WINDOWS) {
              Rest.Todayis.openFolder(e.data.path);
            }
          }),
          $(`<label class="li-item-name">${todayis.name}</label>`).on('click', todayis, (e) => {
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
        )
      );
    });
  },
};

function compare(d1, d2) {
  if (typeof d1 === 'number') {
    return d1 - d2;
  } else if (typeof d1 === 'string') {
    return d1.toLowerCase().localeCompare(d2.toLowerCase());
  } else {
    return d1 > d2 ? 1 : -1;
  }
}
