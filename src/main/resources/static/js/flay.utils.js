/**
 * flay utility
 */
var todayYear = new Date().getFullYear();

var Util = {
		Tag: {
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
				var idx = Util.Tag.indexOf(tags, tag);
				if (idx < 0) {
					tags.push(tag.id);
				}
			},
			remove: function(tags, tag) {
				var idx = Util.Tag.indexOf(tags, tag);
				if (idx > -1) {
					tags.splice(idx, 1);
				}
			},
			sort: function(tags) {
				tags.sort(function(t1, t2) {
					return t1.name.localeCompare(t2.name);
				});
			}
		},
		Actress: {
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
			},
			getAge: function(actress) {
				if (actress.birth && actress.birth.length > 3) {
					return todayYear - parseInt(actress.birth.substring(0, 4)) + 1;
				} else {
					return '';
				}
			},
			toArray: function(names) {
				var split = names.split(",");
				for (var i=0; i<split.length; i++) {
					split[i] = split[i].trim();
				}
				return split;
			}
		}
};


var View = {
		flay: function(opus) {
			Popup.open(PATH + "/html/info/info.flay.html?opus=" + opus, "flay-" + opus, 820, 750);
		},
		video: function(opus) {
			Popup.open(PATH + "/info/video/" + opus, "video-" + opus, 800, 640);
		},
		actress: function(name) {
			Popup.open(PATH + "/html/info/info.actress.html?name=" + name, "actress-" + name, 1000, 600);
		},
		tag: function(tagId) {
//			Popup.open(PATH + "/info/tag/" + tagId, "Tag-" + tagId, 800, 650);
			Popup.open(PATH + "/html/info/info.tag.html?id=" + tagId, "Tag-" + tagId, 800, 650);
		}
};

var URL_SEARCH_VIDEO = 'https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=',
	URL_SEARCH_ACTRESS = 'https://www.minnano-av.com/search_result.php?search_scope=actress&search=+Go+&search_word=',
	URL_SEARCH_TORRENT = 'https://www.google.co.kr/search?q=',
	URL_TRANSLATE = 'https://translate.google.co.kr/?hl=ko&tab=wT#ja/ko/';

var Search = {
		opus: function(keyword) {
			Popup.open(URL_SEARCH_VIDEO + keyword, 'videoSearch', 1500, 1000);
		},
		actress: function(keyword) {
			Popup.open(URL_SEARCH_ACTRESS + encodeURI(keyword), 'actressSearch', 1200, 950);
		},
		torrent: function(keyword) {
			Popup.open(URL_SEARCH_TORRENT + keyword + '+FHD+torrent', 'torrentSearch', 900, 950);
		},
		translate: function(message) {
			Popup.open(URL_TRANSLATE + message, 'translate', 1000, 500);
		},
		opusByRandom: function() {
			var opus = Random.getInteger(1, 999);
			Search.opus(opus);
		}
};
