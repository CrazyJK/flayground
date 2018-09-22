/**
 * Rest Service
 */
var restCall = function(url, args, callback) {
	var DEFAULTS = {
			method: "GET",
			data: {},
			mimeType: "application/json",
			contentType: "application/json",
			async: true,
			cache: false,
			title: ""
	};	
	var settings = $.extend({}, DEFAULTS, args);
	if (settings.method != 'GET' && typeof settings.data === 'object') {
		settings.data = JSON.stringify(settings.data);
	}

	settings.title != "" && loading.on(settings.title);
	
	console.log('restCall', settings.method, url, settings.data);
	$.ajax(PATH + url, settings).done(function(data) {
		if (callback)
			callback(data);
		settings.title != "" && loading.off();
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.log("restCall fail", url, '\n jqXHR=', jqXHR, '\n textStatus=', textStatus, '\n errorThrown=', errorThrown);
		var errMsg = "";
		if (jqXHR.getResponseHeader('error')) {
			errMsg = 'Message: ' + jqXHR.getResponseHeader('error.message') + "<br>" 
				   + 'Cause: '   + jqXHR.getResponseHeader('error.cause');
		} else if (jqXHR.responseJSON) {
			errMsg = 'Error: '     + jqXHR.responseJSON.error + '<br>'  
//				   + 'Exception: ' + jqXHR.responseJSON.exception + '<br>'
				   + 'Message: '   + jqXHR.responseJSON.message + '<br>'
//				   + 'Timestamp: ' + jqXHR.responseJSON.timestamp + '<br>'
				   + 'Status: '    + jqXHR.responseJSON.status + '<br>'
				   + 'Path: '      + jqXHR.responseJSON.path;
		} else {
			errMsg = 'Error:<br>' + textStatus + "<br>" + errorThrown;
		}
		var $errorBody = $("<div>", {'class': 'overlay-error-body'}).append(errMsg);
		loading.on($errorBody);
	}).always(function(data_jqXHR, textStatus, jqXHR_errorThrown) {
	});
};

var Rest = {
		Flay: {
			get: function(opus, callback) {
				console.log("Rest.Flay.get", opus);
				restCall('/flay/' + opus, {}, callback);
			},
			list: function(callback) {
				console.log("Rest.Flay.list");
				restCall('/flay/list', {}, callback);
			},
			search: function(search, callback) {
				console.log("Rest.Flay.search", search);
				restCall('/flay/find', {data: search}, callback);
			},
			find: function(query, callback) {
				console.log("Rest.Flay.find", query);
				restCall('/flay/find/' + query, {}, callback);
			},
			findByTag: function(tag, callback) {
				console.log("Rest.Flay.findByTag", tag);
				restCall("/flay/find/tag/" + tag.id , {}, callback);
			},
			findByActress: function(actress, callback) {
				console.log("Rest.Flay.findByActress", actress);
				restCall("/flay/find/actress/" + actress.name , {}, callback);
			},
			findCandidates: function(callback) {
				console.log("Rest.Flay.findCandidates");
				restCall("/flay/candidates", {}, callback);
			},
			acceptCandidates: function(flay, callback) {
				console.log("Rest.Flay.acceptCandidates", flay);
				restCall('/flay/candidates/' + flay.opus, {method: "PATCH"}, callback);
			},
			play: function(flay) {
				console.log("Rest.Flay.play", flay);
				restCall('/flay/play/' + flay.opus, {method: "PATCH"});
			},
			subtitles: function(flay) {
				console.log("Rest.Flay.subtitles", flay);
				restCall('/flay/edit/' + flay.opus, {method: "PATCH"});
			},
			rename: function(opus, flay, callback) {
				console.log("Rest.Flay.rename", opus, flay);
				restCall('/flay/rename/' + opus, {data: flay, method: "PUT"}, callback);
			},
			openFolder: function(folder) {
				console.log("Rest.Flay.openFolder", folder);
				restCall('/flay/open/folder', {method: "PUT", data: folder});
			}
		},
		History: {
			find: function(query, callback) {
				console.log("Rest.History.find", query);
				restCall('/info/history/find/' + query, {}, callback);
			}
		},
		Video: {
			update: function(video, callback) {
				console.log("Rest.Video.update", video);
				restCall('/info/video', {data: video, method: "PATCH"}, callback);
			}
		},
		Studio: {
			findOneByOpus: function(opus, callback) {
				console.log("Rest.Studio.findOneByOpus", opus);
				restCall('/info/studio/findOneByOpus/' + opus, {}, callback);
			}
		},
		Actress: {
			get: function(name, callback) {
				console.log("Rest.Actress.get", name);
				restCall('/info/actress/' + name, {}, callback);
			},
			update: function(actress, callback) {
				console.log("Rest.Actress.update", actress);
				restCall('/info/actress', {data: actress, method: "PATCH"}, callback);
			},
			rename: function(originalName, actress, callback) {
				console.log("Rest.Actress.rename", originalName, actress);
				restCall('/info/actress/' + originalName, {data: actress, method: "PUT"}, callback);
			}
		},
		Tag: {
			get: function(tagId, callback) {
				console.log("Rest.Tag.get", tagId);
				restCall('/info/tag/' + tagId, {}, callback);
			},
			list: function(callback) {
				console.log("Rest.Tag.list");
				restCall('/info/tag/list', {}, callback);
			},
			create:	function(tag, callback) {
				console.log("Rest.Tag.create", tag);
				restCall('/info/tag', {data: tag, method: "POST"}, callback);
			},
			update: function(tag, callback) {
				console.log("Rest.Tag.update", tag);
				restCall('/info/tag', {data: tag, method: "PATCH"}, callback);
			},
			delete: function(tag, callback) {
				console.log("Rest.Tag.delete", tag);
				restCall('/info/tag', {data: tag, method: "DELETE"}, callback);
			}
		},
		Cover: {
			save: function(opus, callback) {
				console.log("Rest.Cover.save", opus, title);
				restCall('/rest/video/' + opus + '/saveCover', {method: "POST", data: {title: 'Find ' + opus + ' cover'}}, callback);
			}
		},
		Image: {
			size: function(callback) {
				console.log("Rest.Image.size");
				restCall('/image/size', {}, callback);
			},
			download: function(data, callback) {
				console.log("Rest.Image.download", data);
				restCall('/image/pageImageDownload', {data: data, title: 'Download images'}, callback);
			}
		},
		Html: {
			get: function(url, callback) {
				console.log("Rest.Html.get", url);
				restCall(url, {contentType: "text/html", mimeType: "text/html"}, callback); 
			}
		},
		Batch: {
			start: function(type, title, callback) {
				console.log("Rest.Batch.start", type, title);
				restCall('/batch/start/' + type, {method: "PUT", title: title}, callback);
			},
			setOption: function(type, callback) {
				console.log("Rest.Batch.setOption", type);
				restCall('/batch/option/' + type, {method: "PUT"}, callback);
			},
			getOption: function(type, callback) {
				console.log("Rest.Batch.getOption", type);
				restCall('/batch/option/' + type, {}, callback);
			},
			reload: function(callback) {
				console.log("Rest.Batch.reload");
				restCall("/batch/reload", {method: "PUT", title: "Source reload"}, callback);
			}
		}
};
