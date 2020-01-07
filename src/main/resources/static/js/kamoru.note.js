/**
 * note
 */

$(document).ready(function() {
	$(".note-btn").on("click", function() {
		var note = new Note();
		note.show();
	});
});	

function Note() {
	this.id;
	this.title;
	this.content;
	this.$note = $('<div class="card bg-warning m-2" style="width: 320px;">'
			+ '<div class="card-body">'
			+ '<h4 class="card-title">Note title</h4>'
			+ '<p class="card-text">Note content</p>'
			+ '<a href="#" class="btn btn-sm btn-primary">Done</a>'
			+ '</div>'
			+ '</div>');
}

Note.prototype.setTitle = function(title) {
	this.title = title;
	this.$note.find('.card-title').html(title);
};

Note.prototype.setContent = function(content) {
	this.content = content;
	this.$note.find('.card-text').html(content);
};

Note.prototype.show = function() {
	this.id = 3;
	this.setTitle('tItLe');
	this.setContent('content');
	console.log("note show", this.id, this.title, this.content);

	this.$note.appendTo($("body"));
	
};

