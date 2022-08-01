/**
 * note
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'bootstrap/dist/js/bootstrap';
import './lib/crazy.jquery';
import './lib/FlayMenu';
import './css/common.scss';
import './flay.note.scss';

import { restCall, Rest } from './lib/flay.rest.service.js';
import { DateUtils, Random, PATH } from './lib/crazy.common.js';

var totalCount = 0;

$('.note-btn').on('click', function () {
  new Note().show();
});
// get note list
restCall('/info/note/list', {}, function (list) {
  list.forEach(function (note) {
    if (note.status === 'N') new Note(note).show();
  });
});

Rest.Image.size(function (count) {
  totalCount = count;
});

function Note(data) {
  var self = this;

  var DEFAULTS = {
    id: new Date().getTime(),
    title: DateUtils.format('yy/MM/dd HH:mm'),
    content: '',
    position: {
      left: Random.getInteger(100, $(window).width() - 100),
      top: Random.getInteger(100, $(window).height() - 100),
    },
    size: {
      width: '16rem',
      height: '10rem',
    },
    created: new Date(),
    modified: null,
    closed: null,
    windowMinimized: false,
    status: 'N',
    picidx: Random.getInteger(0, totalCount),
    color: Random.getBoolean() ? 'yellow' : 'red',
  };
  this.data = $.extend({}, DEFAULTS, data);

  this.$note = $(`<div class="note">
				<div class="note-control">
					<a href="#" class="note-minimize-btn"><i class="fa fa-window-minimize"></i></a>
					<a href="#" class="note-restore-btn"><i class="fa fa-window-restore"></i></a>
					<a href="#" class="note-delete-btn"><i class="fa fa-window-close"></i></a>
				</div>
				<div class="note-header">
					<h5 class="note-title">${this.data.title}</h5>
				</div>
				<div class="note-body">
					<textarea class="note-pad" placeholder="Memo content">${this.data.content}</textarea>
				</div>'
				<div class="note-tail">'
					<label class="note-time">${DateUtils.format('yyyy/MM/dd HH:mm', this.data.modified)}</label>
				</div>'
			</div>`)
    .css({
      left: Math.min(this.data.position.left, $(window).width() - 16 * 16),
      top: Math.min(this.data.position.top, $(window).height() - 10 * 16),
      width: this.data.size.width,
      height: this.data.size.height,
      backgroundImage: 'url(' + PATH + '/static/image/' + this.data.picidx + ')',
    })
    .addClass(this.data.color);

  this.$note.find('.note-minimize-btn').on('click', function () {
    $(this).parent().children().toggle();
    self.$note.addClass('note-minimize');
    self.$note.resizable('disable');
    self.minimizeCallback(true);
  });
  this.$note.find('.note-restore-btn').on('click', function () {
    $(this).parent().children().toggle();
    self.$note.removeClass('note-minimize');
    self.$note.resizable('enable');
    self.minimizeCallback(false);
  });
  this.$note.find('.note-delete-btn').on('click', function () {
    self.hideNote(function () {
      self.$note.remove();
    });
  });
  this.$note
    .find('.note-pad')
    .on('blur', function () {
      var content = $(this).val();
      if (content !== '' && content !== self.data.content) {
        var title = content.substring(0, 8);
        self.$note.find('.note-title').html(title);
        self.data.title = title;
        self.data.content = content;
        self.data.modified = new Date().getTime();
        self.saveNote();
      }
    })
    .on('keyup', function (e) {
      e.stopPropagation();
      console.log('note-pad height', $(this).height());
    });

  this.minimizeCallback = function (val) {
    self.data.windowMinimized = val;
    self.saveNote();
  };
  this.dragCallback = function (event, ui) {
    self.data.position = ui.position;
    self.saveNote();
  };
  this.resizeCallback = function (event, ui) {
    self.data.size = ui.size;
    self.saveNote();
  };

  this.saveNote = function (callback) {
    restCall('/info/note', { data: self.data, method: 'PUT' }, callback);
    console.log('save note', self.data);
  };
  this.hideNote = function (callback) {
    self.data.status = 'D';
    restCall('/info/note', { data: self.data, method: 'PUT' }, callback);
    console.log('hide note', self.data);
  };
  this.deleteNote = function (callback) {
    restCall('/info/note', { data: self.data, method: 'DELETE' }, callback);
    console.log('delete note', self.data);
  };

  if (this.data.windowMinimized) {
    self.$note.addClass('note-minimize');
  }
}

Note.prototype.show = function () {
  var self = this;

  var wrapper = 'noteWrapper';
  if ($('#' + wrapper).length === 0) {
    $('<div>', { id: wrapper }).appendTo($('body'));
  }

  this.$note.appendTo($('#' + wrapper));
  this.$note.draggable({
    stop: this.dragCallback,
  });
  this.$note.resizable({
    stop: this.resizeCallback,
    disabled: this.data.windowMinimized,
  });

  if (this.data.windowMinimized) {
    self.$note.find('.note-control').children().toggle();
  }

  console.log('note show');
};

var noteColors = ['yellow', 'red'],
  isListAll = false;

function showList(list) {
  console.log('list', list.length);

  $('#noteList').empty();
  list.forEach(function (note, idx) {
    $('#noteList').append(
      $('<tr>').append(
        $('<td>').html(idx + 1),
        $('<td>').html(note.id),
        $('<td>').html(note.author),
        $('<td>').html(note.title),
        $('<td>').html(note.content),
        $('<td>').html(new Date(note.created).format('MM/dd HH:mm')),
        $('<td>').html(new Date(note.modified).format('MM/dd HH:mm')),
        $('<td>').html(new Date(note.closed).format('MM/dd HH:mm')),
        $('<td>').html('L: ' + note.position.left + ' T: ' + note.position.top),
        $('<td>').html('W: ' + note.size.width + ' H: ' + note.size.height),
        $('<td>').append(
          $('<input>', { class: 'form-control form-control-sm width-70 border-0 bg-transparent', type: 'number' })
            .val(note.picidx)
            .on('change', function () {
              note.picidx = $(this).val();
              restCall('/info/note', { data: note, method: 'PUT' }, function () {
                console.log('update note picidx');
              });
            })
        ),
        $('<td>').append(
          $('<select>', { class: 'form-control form-control-sm w-auto border-0 bg-light bg-transparent' })
            .append(
              $('<option>', { value: 'unset' }).text('unset'),
              (function () {
                var options = [];
                noteColors.forEach(function (color) {
                  options.push($('<option>', { selected: color === note.color, value: color }).text(color));
                });
                return options;
              })()
            )
            .on('change', function () {
              note.color = $(this).val();
              restCall('/info/note', { data: note, method: 'PUT' }, function () {
                console.log('update note color');
              });
            })
        ),
        $('<td>').append(
          $('<div>', { class: 'custom-control custom-switch' }).append(
            $('<input>', { type: 'checkbox', class: 'custom-control-input', id: 'note-' + note.id + '-mini', checked: note.windowMinimized }).on('change', function () {
              var val = $(this).prop('checked');
              note.windowMinimized = val;
              $(this)
                .next()
                .html(val ? 'mini' : 'max');
              restCall('/info/note', { data: note, method: 'PUT' }, function () {
                console.log('update note windowMinimized');
              });
            }),
            $('<label>', { class: 'custom-control-label', for: 'note-' + note.id + '-mini' }).html(note.windowMinimized ? 'mini' : 'max')
          )
        ),
        $('<td>').append(
          $('<div>', { class: 'custom-control custom-switch' }).append(
            $('<input>', { type: 'checkbox', class: 'custom-control-input', id: 'note-' + note.id + '-status', checked: note.status == 'N' }).on('change', function () {
              var val = $(this).prop('checked') ? 'N' : 'D';
              note.status = val;
              $(this).next().html(val);
              restCall('/info/note', { data: note, method: 'PUT' }, function () {
                console.log('update note status');
              });
            }),
            $('<label>', { class: 'custom-control-label', for: 'note-' + note.id + '-status' }).html(note.status)
          )
        ),
        $('<td>').append(
          $('<button>', { class: 'btn btn-sm text-danger' })
            .on('click', function () {
              if (confirm('sure?')) {
                var $thisNote = $(this).parent().parent();
                restCall('/info/note', { data: note, method: 'DELETE' }, function () {
                  console.log('delete note', $thisNote);
                  $thisNote.remove();
                });
              }
            })
            .append($('<i>', { class: 'fa fa-trash-o mr-1' }))
        )
      )
    );
  });
}

$('#switchTitleInline').on('change', function () {
  var checked = $(this).prop('checked');
  $('tbody > tr > td:nth-child(5)').each(function () {
    if (checked) {
      $(this).html($(this).html().replace(/<br>/g, '\n'));
    } else {
      $(this).html($(this).html().replace(/\n/g, '<br>'));
    }
  });
});

$('.search-input')
  .on('keyup', function (e, init) {
    if (init) {
      restCall('/info/note/list', { headers: { admin: isListAll } }, showList);
    } else if (e.keyCode === 13) {
      var keyword = $(this).val();
      if (keyword !== '') {
        console.log('search keyword', keyword);
        var note = {
          title: keyword,
          content: keyword,
        };
        restCall('/info/note/find', { data: note, method: 'PATCH', headers: { admin: isListAll } }, showList);
      } else {
        restCall('/info/note/list', { headers: { admin: isListAll } }, showList);
      }
    }
  })
  .trigger('keyup', [true]);

$('#listAll').on('change', function () {
  isListAll = $('#listAll').prop('checked');
  console.log('#listAll checked', isListAll);
});
