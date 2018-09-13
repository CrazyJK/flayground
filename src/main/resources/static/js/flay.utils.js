/**
 * video common function
 */

var View = {
		flay: function(opus) {
			popup.open(PATH + "/flay/" + opus, "flay-" + opus, 800, 640);
		},
		video: function(opus) {
			popup.open(PATH + "/info/video/" + opus, "video-" + opus, 800, 640);
		},
		actress: function(name) {
			popup.open(PATH + "/info/actress/" + name, "actress-" + name, 850, 600);
		}
};

var Flay = {
		play: function(flay) {
			restCall(PATH + '/flay/' + flay.opus + '/play', {method: "PATCH"});
		},
		subtitles: function(flay) {
			restCall(PATH + '/flay/' + flay.opus + '/edit', {method: "PATCH"});
		}
};

var Video = {
		update: function(video, callback) {
			restCall(PATH + '/info/video', {data: video, method: "PATCH"}, callback);
		}
};

var Actress = {
		get: function(name, callback) {
			restCall(PATH + '/info/actress/' + name, {}, callback);
		},
		update: function(actress, callback) {
			restCall(PATH + '/info/actress', {data: actress, method: "PATCH"}, callback);
		}
};

var Tag = {
	create:	function(tag, callback) {
		restCall(PATH + '/info/tag', {data: tag, method: "POST"}, callback);
	},
	update: function(tag, callback) {
		restCall(PATH + '/info/tag', {data: tag, method: "PATCH"}, callback);
	},
	delete: function(tag, callback) {
		restCall(PATH + '/info/tag', {data: tag, method: "DELETE"}, callback);
	}
};

var TagUtils = {
		includes: function(tags, tag) {
			var found = false;
			$.each(tags, function(idx, tagId) {
				if (tagId === tag.id) {
					found = true;
				}
			});
			return found;
		},
		indexOf: function(tags, tag) {
			var found = -1;
			$.each(tags, function(idx, tagId) {
				if (tagId === tag.id) {
					found = idx;
				}
			});
			return found;
		},
		push: function(tags, tag) {
			var idx = TagUtils.indexOf(tags, tag);
			if (idx < 0) {
				tags.push(tag.id);
			}
		},
		remove: function(tags, tag) {
			var idx = TagUtils.indexOf(tags, tag);
			if (idx > -1) {
				tags.splice(idx, 1);
			}
		},
		sort: function(tags) {
			tags.sort(function(t1, t2) {
				return t1.name.localeCompare(t2.name);
			});
		}
};

var ActressUtils = {
		getNames: function(actressList) {
			var actressNames = "";
			if (actressList != null && Array.isArray(actressList)) {
				$.each(actressList, function(idx, actress) {
					if (idx > 0)
						actressNames += ", ";
					actressNames += actress;
				});
			}
			return actressNames;
		}
};


var Action = {
		openFolder: function(folder) {
			restCall(PATH + '/flayon/openFolder', {method: "PUT", data: {folder: folder}});
		}
};

var Batch = {
		start: function(type, title, callback) {
			restCall(PATH + '/batch/start/' + type, {method: "PUT", title: title}, callback);
		},
		setOption: function(type, callback) {
			restCall(PATH + '/batch/option/' + type, {method: "PUT"}, callback);
		},
		getOption: function(type, callback) {
			restCall(PATH + '/batch/option/' + type, {}, callback);
		},
		reload: function(callback) {
			restCall(PATH + "/batch/reload", {method: "PUT", title: "Source reload"}, callback);
		}
};

var Search = {
		opus: function(keyword) {
			popup.open(URL_SEARCH_VIDEO + keyword, 'videoSearch', 1500, 1000);
		},
		actress: function(keyword) {
			popup.open(URL_SEARCH_ACTRESS + keyword, 'actressSearch', 1200, 950);
		},
		torrent: function(keyword) {
			popup.open(URL_SEARCH_TORRENT + keyword + '+FHD+torrent', 'torrentSearch', 900, 950);
		},
		translate: function(message) {
			popup.open(URL_TRANSLATE + message, 'translate', 1000, 500);
		},
		opusByRandom: function() {
			var opus = random.getInteger(1, 999);
			Search.opus(opus);
		}
};
