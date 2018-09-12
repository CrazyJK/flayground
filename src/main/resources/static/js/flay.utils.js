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
		}
};

var ActressUtils = {
		getNames: function(actressList) {
			var actressNames = "";
			if (actressList != null && Array.isArray(actressList)) {
				$.each(actressList, function(idx, actress) {
					if (idx > 0)
						actressNames += ", ";
					actressNames += actress.name;
				});
			}
			return actressNames;
		}
};


var Action = {
		openFolder: function(folder) {
			restCall(PATH + '/flayon/openFolder', {method: "PUT", data: {folder: folder}, showLoading: false});
		},
		reload: function() {
			restCall(PATH + "/rest/video/reload", {method: "PUT", title: "Source reload"});
		}
};


var Search = {
		opus: function(keyword) {
			popup.open(urlSearchVideo + keyword, 'videoSearch', 1500, 1000);
		},
		actress: function(keyword) {
			popup.open(urlSearchActress + keyword, 'actressSearch', 1200, 950);
		},
		torrent: function(keyword) {
			popup.open(urlSearchTorrent + keyword + '+FHD+torrent', 'torrentSearch', 900, 950);
		},
		translate: function(message) {
			var translateURL = "https://translate.google.co.kr/?hl=ko&tab=wT#ja/ko/" + message;
			popup.open(translateURL, 'translate', 1000, 500);
		},
		opusByRandom: function() {
			var opus = random.getInteger(1, 999);
			Search.opus(opus);
		}
};
