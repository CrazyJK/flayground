/**
 * flay utility
 */
var todayYear = new Date().getFullYear();

var Util = {
	Tag: {
		includes: function (tags, tag) {
			var found = false;
			$.each(tags, function (idx, tagId) {
				if (tagId === tag.id) {
					found = true;
				}
			});
			return found;
		},
		indexOf: function (tags, tag) {
			var found = -1;
			$.each(tags, function (idx, tagId) {
				if (tagId === tag.id) {
					found = idx;
				}
			});
			return found;
		},
		push: function (tags, tag) {
			var idx = Util.Tag.indexOf(tags, tag);
			if (idx < 0) {
				tags.push(tag.id);
			}
		},
		remove: function (tags, tag) {
			var idx = Util.Tag.indexOf(tags, tag);
			if (idx > -1) {
				tags.splice(idx, 1);
			}
		},
		sort: function (tags) {
			tags.sort(function (t1, t2) {
				return t1.name.localeCompare(t2.name);
			});
		},
	},
	Actress: {
		getNames: function (actressList) {
			var actressNames = "";
			if (actressList != null && Array.isArray(actressList)) {
				$.each(actressList, function (idx, actress) {
					if (idx > 0) actressNames += ", ";
					actressNames += actress;
				});
			}
			return actressNames;
		},
		get: function (actressList, className) {
			var list = [];
			if (actressList != null && Array.isArray(actressList)) {
				if (!className) {
					className = "actress";
				}
				$.each(actressList, function (idx, actress) {
					var $actress = $("<span>", { class: className })
						.html(actress)
						.on("click", function () {
							View.actress(actress);
						})
						.css({
							cursor: "pointer",
						});
					list.push($actress);
				});
			}
			return list;
		},
		getAge: function (actress) {
			if (actress.birth && actress.birth.length > 3) {
				return todayYear - parseInt(actress.birth.substring(0, 4)) + 1;
			} else {
				return 0;
			}
		},
		getCup: function (actress) {
			return actress.body.replace(/[-0-9\s]/g, "");
		},
		toArray: function (names) {
			var split = names.split(",");
			for (var i = 0; i < split.length; i++) {
				split[i] = split[i].trim();
			}
			return split;
		},
	},
};

var View = {
	flay: function (opus) {
		Popup.open(PATH + "/html/info/info.flay.html?opus=" + opus, "flay-" + opus, 800, 770);
	},
	video: function (opus) {
		Popup.open(PATH + "/info/video/" + opus, "video-" + opus, 400, 300);
	},
	actress: function (name) {
		Popup.open(PATH + "/html/info/info.actress.html?name=" + name, "actress-" + name, 1072, 1100);
	},
	tag: function (tagId) {
		//			Popup.open(PATH + "/info/tag/" + tagId, "Tag-" + tagId, 800, 650);
		Popup.open(PATH + "/html/info/info.tag.html?id=" + tagId, "Tag-" + tagId, 1072, 650);
	},
	studio: function (name) {
		Popup.open(PATH + "/html/info/info.studio.html?s=" + name, "Studio-" + name, 1072, 1900);
	},
};

const URL_SEARCH_VIDEO_4_FIREFOX = "https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=";
const URL_SEARCH_VIDEO = "https://nextjav.com/torrent/detail/";
const URL_SEARCH_ACTRESS = "https://www.minnano-av.com/search_result.php?search_scope=actress&search=+Go+&search_word=";
const URL_SEARCH_TORRENT = "https://www.google.co.kr/search?q=";
const URL_TRANSLATE = "https://translate.google.co.kr/?hl=ko&tab=wT#ja/ko/";
const URL_FIND_ACTRESS = "http://javtorrent.re/tag/";
const URL_SEARCH_SUBTITLES = "https://www.subtitlecat.com/index.php?search=";

var Search = {
	opus: function (keyword) {
		var url = FIREFOX === browser ? URL_SEARCH_VIDEO_4_FIREFOX : URL_SEARCH_VIDEO;
		Popup.open(url + keyword, "videoSearch", 1500, 1000);
	},
	actress: function (keyword) {
		Popup.open(URL_SEARCH_ACTRESS + encodeURI(keyword), "actressSearch", 1200, 950);
	},
	torrent: function (keyword) {
		Popup.open(URL_SEARCH_TORRENT + keyword + "+FHD+torrent", "torrentSearch", 900, 950);
	},
	translate: function (message) {
		Popup.open(URL_TRANSLATE + message, "translate", 1000, 500);
	},
	opusByRandom: function () {
		var opus = Random.getInteger(1, 999);
		Search.opus(opus);
	},
	find: function (keyword) {
		Popup.open(URL_FIND_ACTRESS + encodeURI(keyword), "findSearch", 1200, 950);
	},
	subtitles: function (keyword, w, h) {
		Popup.open(URL_SEARCH_SUBTITLES + keyword, "subtitlesSearch", w || 900, h || 950);
	},
	subtitlesUrlIfFound: function (opus, callback) {
		$.ajax({
			url: "/file/find/exists/subtitles?opus=" + opus,
			success: function (foundUrlList) {
				if (callback) {
					callback(foundUrlList);
				}
			},
		});
	},
};

var Security = {
	user: null,
	getUser: function () {
		Rest.Security.whoami(function (principal) {
			Security.user = principal;
		});
	},
	hasRole: function (role) {
		if (Security.user == null) {
			Security.getUser();
		}
		for (var x in Security.user.authorities) {
			if (Security.user.authorities[x].authority === "ROLE_" + role) {
				return true;
			}
		}
		return false;
	},
	getName: function () {
		if (Security.user == null) {
			Security.getUser();
		}
		return Security.user.username;
	},
	isAutomaticallyCertificated: function () {
		return Rest.Security.isAutomaticallyCertificated();
	},
};
