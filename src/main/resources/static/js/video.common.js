/**
 * video common function
 */

var view = {
		studio: function(name) {
			popup.open(PATH + "/video/studio/" + name, "studioDetail-" + name, 850, 600);
		},
		video: function(opus) {
			popup.open(PATH + "/video/" + opus, "videoDetail-" + opus, 800, 640);
		},
		actress: function(name) {
			popup.open(PATH + "/video/actress/" + name, "actressDetail-" + name, 850, 600);
		}
};

var action = {
		play: function(opus) {
			restCall(PATH + '/rest/video/' + opus + '/exec/play', {method: "PUT", showLoading: false});
		},
		subtitles: function(opus) {
			restCall(PATH + '/rest/video/' + opus + '/exec/subtitles', {method: "PUT", showLoading: false});
		},
		rank: function(opus, rank, callback) {
			restCall(PATH + "/rest/video/" + opus + "/rank/" + rank, {method: "PUT", showLoading: false}, callback);
		},
		overview: function(opus, text, callback) {
			restCall(PATH + '/rest/video/' + opus + '/overview', {method: "PUT", data: {overview: text}, showLoading: false }, callback);
		},
		favorite: function(name, val, callback) {
			restCall(PATH + "/rest/actress/" + name + "/favorite/" + val, {method: "PUT", showLoading: false}, function(result) {
				callback(result);
			});
		},
		toggleTag: function(opus, tagId, callback) {
			restCall(PATH + "/rest/video/" + opus + "/tag?id=" + tagId, {method: "PUT"}, function(checked) {
				callback(checked);
			});
		},
		createTag: function(opus, name, desc, callback) {
			restCall(PATH + "/rest/tag", {method: "POST", data: {opus: opus, name: name, description: desc}, showLoading: false}, function(tag) {
				callback(tag);
			});
		},
		openFolder: function(folder) {
			restCall(PATH + '/flayon/openFolder', {method: "PUT", data: {folder: folder}, showLoading: false});
		},
		reload: function() {
			restCall(PATH + "/rest/video/reload", {method: "PUT", title: "Source reload"});
		}
};

var search = {
		opus: function() {
			var query = arguments.length == 0 ? $("#query").val() : arguments[0];
			popup.open(urlSearchVideo + query, 'videoSearch', 1500, 1000);
		},
		actress: function() {
			var $query   = $("#query");
			var $actress = $("#actress");
			var query = "";
			if (arguments.length === 0) {
				if ($actress.length > 0 && $actress.val().length > 0) {
					query = $actress.val();
				} else if ($query.length > 0 &&  $query.val().length > 0) {
					query = $query.val();
				}
			} else {
				query = arguments[0];
			}
			popup.open(urlSearchActress + query, 'actressSearch', 1200, 950);
		},
		torrent: function() {
			var query = arguments.length == 0 ? $("#query").val() : arguments[0];
			popup.open(urlSearchTorrent + query + '+FHD+torrent', 'torrentSearch', 900, 950);
		},
		translate: function(message) {
			var translateURL = "https://translate.google.co.kr/?hl=ko&tab=wT#ja/ko/" + message;
			popup.open(translateURL, 'translate', 1000, 500);
		},
		opusByRandom: function() {
			var opus = random.getInteger(1, 999);
			search.opus(opus);
		}
};
