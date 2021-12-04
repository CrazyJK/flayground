/**
 * flay utility
 */
const todayYear = new Date().getFullYear();

const Util = {
	Tag: {
		includes: function (tags, _tag) {
			var found = false;
			$.each(tags, function (idx, tag) {
				if (tag.id === _tag.id) {
					found = true;
				}
			});
			return found;
		},
		indexOf: function (tags, _tag) {
			var found = -1;
			$.each(tags, function (idx, tag) {
				if (tag.id === _tag.id) {
					found = idx;
				}
			});
			return found;
		},
		push: function (tags, tag) {
			var idx = Util.Tag.indexOf(tags, tag);
			if (idx < 0) {
				tags.push(tag);
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
			var actressNames = '';
			if (actressList != null && Array.isArray(actressList)) {
				$.each(actressList, function (idx, actress) {
					if (idx > 0) actressNames += ', ';
					actressNames += actress;
				});
			}
			return actressNames;
		},
		get: function (actressList, className) {
			var list = [];
			if (actressList != null && Array.isArray(actressList)) {
				$.each(actressList, function (idx, actress) {
					var $actress = $('<span>', { class: className ?? 'actress' })
						.html(actress)
						.on('click', function () {
							View.actress(actress);
						})
						.css({
							cursor: 'pointer',
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
			return actress.body.replace(/[-0-9\s]/g, '');
		},
		toArray: function (names) {
			var split = names.split(',');
			for (var i = 0; i < split.length; i++) {
				split[i] = split[i].trim();
			}
			return split;
		},
	},
};

const View = {
	flay: function (opus) {
		Popup.open(PATH + '/html/info/info.flay.html?opus=' + opus, 'flay-' + opus, 800, 770);
	},
	flayInPage: (flay) => {
		if ($('#flayInPage').length === 0) {
			$(`	<div id="flayInPage" class="collapse fixed-center rounded shadow" style="width: 800px">
					<span class="text-light hover" style="position: absolute; right: 0; bottom: 0; margin: 5px; font-size: 3rem; line-height: 0.5; text-shadow: 0px 0px 4px #000;" onclick="$(this).parent().hide();">&times;</span>
					<div style="font-size: initial; font-family: initial; box-shadow: 0 0 0.125rem 0.125rem orange, 0 0 1rem 1rem #000;"></div>
				</div>`).appendTo($('body'));
		}
		$('#flayInPage > div').empty().appendFlayCard(flay);
		$('#flayInPage').show();
	},
	video: function (opus) {
		Popup.open(PATH + '/info/video/' + opus, 'video-' + opus, 400, 300);
	},
	actress: function (name) {
		Popup.open(PATH + '/html/info/info.actress.html?name=' + name, 'actress-' + name, 1072, 1100);
	},
	tag: function (tagId) {
		// Popup.open(PATH + '/info/tag/' + tagId, 'Tag-' + tagId, 800, 650);
		Popup.open(PATH + '/html/info/info.tag.html?id=' + tagId, 'Tag-' + tagId, 1072, 650);
	},
	studio: function (name) {
		Popup.open(PATH + '/html/info/info.studio.html?s=' + name, 'Studio-' + name, 1072, 1900);
	},
};

const URL_SEARCH_ARZON = 'https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=';
const URL_SEARCH_AVNORI = 'https://avnori6.com/bbs/search.php?search_flag=search&stx=';
const URL_SEARCH_NEXTJAV = 'https://nextjav.com/torrent/detail/';
const URL_SEARCH_AVDBS = 'https://www.avdbs.com/menu/search.php?kwd=';
const URL_SEARCH_ACTRESS = 'https://www.minnano-av.com/search_result.php?search_scope=actress&search=+Go+&search_word=';
const URL_SEARCH_GOOGLE = 'https://www.google.co.kr/search?q=';
const URL_TRANSLATE = 'https://translate.google.co.kr/?hl=ko&tab=wT#ja/ko/';
const URL_TRANSLATE_PAPAGO = 'https://papago.naver.com/?sk=auto&tk=ko&st=';
const URL_FIND_ACTRESS = 'http://javtorrent.re/tag/';
const URL_SEARCH_SUBTITLES = 'https://www.subtitlecat.com/index.php?search=';

const Search = {
	opus: (keyword) => {
		var url = FIREFOX === browser ? URL_SEARCH_ARZON : URL_SEARCH_AVNORI;
		Popup.open(url + keyword, 'opusSearch', 1500, 1000);
	},
	arzon: (keyword) => {
		Popup.open(URL_SEARCH_ARZON + keyword, 'arzonSearch', 800, 1000);
	},
	avnori: (keyword) => {
		Popup.open(URL_SEARCH_AVNORI + keyword, 'avnoriSearch', 800, 1000);
	},
	avdbs: (keyword) => {
		Popup.open(URL_SEARCH_AVDBS + keyword, 'avdbsSearch', 800, 1000);
	},
	nextjav: (keyword) => {
		Popup.open(URL_SEARCH_NEXTJAV + keyword, 'nextjavSearch', 800, 1000);
	},
	actress: (keyword) => {
		Popup.open(URL_SEARCH_ACTRESS + encodeURI(keyword), 'actressSearch', 1200, 950);
	},
	torrent: (keyword) => {
		Popup.open(URL_SEARCH_GOOGLE + keyword + '+FHD+torrent', 'torrentSearch', 900, 950);
	},
	google: (keyword) => {
		Popup.open(URL_SEARCH_GOOGLE + keyword, 'googleSearch', 800, 1000);
	},
	translate: (message) => {
		Popup.open(URL_TRANSLATE_PAPAGO + message, 'translate', 1000, 500);
	},
	opusByRandom: () => {
		Search.opus(Random.getInteger(1, 999));
	},
	find: (keyword) => {
		Popup.open(URL_FIND_ACTRESS + encodeURI(keyword), 'findSearch', 1200, 950);
	},
	subtitles: (keyword, w, h) => {
		Popup.open(URL_SEARCH_SUBTITLES + keyword, 'subtitlesSearch', w || 900, h || 950);
	},
	subtitlesUrlIfFound: (opus, callback) => {
		$.ajax({
			url: '/file/find/exists/subtitles?opus=' + opus,
			success: (foundUrlList) => {
				callback?.(foundUrlList, opus);
			},
		});
	},
};

const Security = {
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
			if (Security.user.authorities[x].authority === 'ROLE_' + role) {
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
