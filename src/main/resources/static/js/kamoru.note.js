/**
 * note
 */

$(document).ready(function() {
	$(".note-btn").on("click", function() {
		new Note().show();
	});
	// get note list
	restCall('/info/note/list', {}, function(list) {
		list.forEach(function(note) {
//			if (note.status === 'N')
				new Note(note).show();
		});
	});
});

function Note(data) {
	
	var DEFAULTS = {
			id: new Date().getTime(),
			title: new Date().format("yy/MM/dd hh:mm"),
			content: '',
			position: {
				left: Random.getInteger(100, $(window).width() - 100),
				top: Random.getInteger(100, $(window).height() - 100)
			},
			size: {
				width: '16rem',
				height: '10rem'
			},
			windowMinimized: false,
			status: 'N'
	};
	this.data = $.extend({}, DEFAULTS, data);

	this.$note = 
			$('<div class="note bg-warning">'
			+ '  <div class="note-control">'
			+ '    <a href="#" class="note-minimize-btn"><i class="fa fa-window-minimize"></i></a>'
			+ '    <a href="#" class="note-restore-btn"><i class="fa fa-window-restore"></i></a>'
			+ '    <a href="#" class="note-delete-btn"><i class="fa fa-window-close"></i></a>'
			+ '  </div>'
			+ '  <div class="note-body">'
			+ '    <h5 class="note-title">' + this.data.title + '</h5>'
			+ '    <textarea class="note-pad" placeholder="Memo content">' + this.data.content + '</textarea>'
			+ '  </div>'
			+ '</div>').css({
				left: Math.min(this.data.position.left, $(window).width() - 100),
				top: Math.min(this.data.position.top, $(window).height() - 100),
				width: this.data.size.width,
				height: this.data.size.height
			});

	var self = this;

	this.$note.find(".note-minimize-btn").on("click", function() {
		$(this).parent().children().toggle();
		self.$note.addClass("note-minimize");
		self.$note.resizable("disable");
		self.minimizeCallback(true);
	});
	this.$note.find(".note-restore-btn").on("click", function() {
		$(this).parent().children().toggle();
		self.$note.removeClass("note-minimize");
		self.$note.resizable("enable");
		self.minimizeCallback(false);
	});
	this.$note.find(".note-delete-btn").on("click", function() {
		self.hideNote(function() {
			self.$note.remove();
		});
	});
	this.$note.find(".note-pad").on("blur", function() {
		self.data.content = $(this).val();
		self.saveNote();
	});

	this.minimizeCallback = function(val) {
		self.data.windowMinimized = val;
		self.saveNote();
	};
	this.dragCallback = function(event, ui) {
		self.data.position = ui.position;
		self.saveNote();
	};
	this.resizeCallback = function(event, ui) {
		self.data.size = ui.size;
		self.saveNote();
	};

	this.saveNote = function(callback) {
		restCall('/info/note', {data: self.data, method: "PUT"}, callback);
		console.log('save note', self.data);
	}
	this.hideNote = function(callback) {
		self.data.status = 'D';
		restCall('/info/note', {data: self.data, method: "PUT"}, callback);
		console.log('hide note', self.data);
	}
	this.deleteNote = function(callback) {
		restCall('/info/note', {data: self.data, method: "DELETE"}, callback);
		console.log('delete note', self.data);
	}
	
	if (this.data.windowMinimized) {
		self.$note.addClass("note-minimize");
	}

}

Note.prototype.show = function() {
	var self = this;
	
	var wrapper = "noteWrapper";
	if ($("#" + wrapper).length === 0) {
		$("<div>", {id: wrapper}).appendTo($("body"));
	}
	
	this.$note.appendTo($("#" + wrapper));
	this.$note.draggable({
		stop: this.dragCallback
	});
	this.$note.resizable({
		stop: this.resizeCallback,
		disabled: this.data.windowMinimized
	});
	
	if (this.data.windowMinimized) {
		self.$note.find(".note-control").children().toggle();
	}

	console.log("note show");
};

