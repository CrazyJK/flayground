/**
 * Rest Service
 */
var restCall = function(url, args, callback) {
	var PATH = "";
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
	
	$.ajax(PATH + url, settings).done(function(data) {
		if (callback)
			callback(data);
		loading.off();
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.log("restCall fail", url, '\njqXHR=', jqXHR, '\ntextStatus=', textStatus, '\nerrorThrown=', errorThrown);
		var errMsg = "";
		if (jqXHR.getResponseHeader('error')) {
			errMsg = 'Message: ' + jqXHR.getResponseHeader('error.message') + "<br>" + 'Cause: ' + jqXHR.getResponseHeader('error.cause');
		} else if (jqXHR.responseJSON) {
			errMsg = 'Error: '    + jqXHR.responseJSON.error + '<br>' + 
					'Exception: ' + jqXHR.responseJSON.exception + '<br>' +
					'Message: '   + jqXHR.responseJSON.message + '<br>' +
					'Timestamp: ' + jqXHR.responseJSON.timestamp + '<br>' +
					'Status: '    + jqXHR.responseJSON.status + '<br>' + 
					'Path: '      + jqXHR.responseJSON.path;
		} else {
			errMsg = 'Error:<br>' + textStatus + "<br>" + errorThrown;
		}
		loading.on(errMsg);
	}).always(function(data_jqXHR, textStatus, jqXHR_errorThrown) {
	});
};

var Rest = {
		Flay: {
			list: function(callback) {
				restCall('/flay/list', {}, callback);
			},
			search: function(search, callback) {
				restCall('/flay/find', {data: search}, callback);
			},
			find: function(query, callback) {
				restCall('/flay/find/' + query, {}, callback);
			},
			findByTag: function(tag, callback) {
				restCall("/flay/find/tag/" + tag.id , {}, callback);
			},
			findCandidates: function(callback) {
				restCall("/flay/candidates", {}, callback);
			},
			acceptCandidates: function(flay, callback) {
				restCall('/flay/candidates/' + flay.opus, {method: "PATCH"}, callback);
			},
			play: function(flay) {
				restCall('/flay/play/' + flay.opus, {method: "PATCH"});
			},
			subtitles: function(flay) {
				restCall('/flay/edit/' + flay.opus, {method: "PATCH"});
			}
		},
		History: {
			find: function(query, callback) {
				restCall('/info/history/find/' + query, {}, callback);
			}
		},
		Video: {
			update: function(video, callback) {
				restCall('/info/video', {data: video, method: "PATCH"}, callback);
			}
		},
		Studio: {
			findOneByOpus: function(opus, callback) {
				restCall('/info/studio/findOneByOpus/' + opus, {}, callback);
			}
		},
		Actress: {
			get: function(name, callback) {
				restCall('/info/actress/' + name, {}, callback);
			},
			update: function(actress, callback) {
				restCall('/info/actress', {data: actress, method: "PATCH"}, callback);
			}
		},
		Tag: {
			list: function(callback) {
				restCall('/info/tag/list', {}, callback);
			},
			create:	function(tag, callback) {
				restCall('/info/tag', {data: tag, method: "POST"}, callback);
			},
			update: function(tag, callback) {
				restCall('/info/tag', {data: tag, method: "PATCH"}, callback);
			},
			delete: function(tag, callback) {
				restCall('/info/tag', {data: tag, method: "DELETE"}, callback);
			}
		},
		Cover: {
			save: function(opus, title, callback) {
				restCall('/rest/video/' + opus + '/saveCover', {method: "POST", data: {title: title}}, callback);
			}
		},
		Image: {
			size: function(callback) {
				restCall('/image/size', {}, callback);
			},
			download: function(data, callback) {
				restCall('/image/pageImageDownload', {data: data, title: 'Download images'}, callback);
			}
		},
		Html: {
			get: function(url, callback) {
				restCall(url, {contentType: "text/html", mimeType: "text/html"}, callback); 
			}
		},
		Action: {
			openFolder: function(folder) {
				restCall('/flayon/openFolder', {method: "PUT", data: {folder: folder}});
			}
		},
		Batch: {
			start: function(type, title, callback) {
				restCall('/batch/start/' + type, {method: "PUT", title: title}, callback);
			},
			setOption: function(type, callback) {
				restCall('/batch/option/' + type, {method: "PUT"}, callback);
			},
			getOption: function(type, callback) {
				restCall('/batch/option/' + type, {}, callback);
			},
			reload: function(callback) {
				restCall("/batch/reload", {method: "PUT", title: "Source reload"}, callback);
			}
		}
};
