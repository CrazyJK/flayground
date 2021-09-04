/**
 * flay summary js
 */

var flayList = [];
Rest.Flay.list(function(list) {
	flayList = list;
});

var actressList = [];
Rest.Actress.list(function(list) {
	actressList = list;
});

const filterCount = 5

/*
$(window).on("resize", function() {
	console.log("$(window).width()", $(window).width());
//	$('canvas').attr("width", $(".card-body").width() - 64);
}).trigger("resize");
*/

$("#groupByRelease").on('show.bs.collapse', function() {
	var val = $("input[name='releasePattern']:checked").val();
	if (typeof val === 'undefined') {
		$("input[name='releasePattern']").first().click();
	}
});

$("input[name='releasePattern']").on('change', function() {
	var releasePattern = $("input[name='releasePattern']:checked").val();
	var getReleaseKey = function(release) {
		if ('YYYY' === releasePattern) {
			return release.substring(0, 4);
		} else if ('YYYYMM' === releasePattern) {
			return release.substring(0, 7);
		} else {
			return release;
		}
	};
	var $list = $("#releasedList").empty();

	var dataMap = {};
	$.each(flayList, function(idx, flay) {
		var key = getReleaseKey(flay.release);
		if (dataMap[key]) {
			dataMap[key].push(flay);
		} else {
			dataMap[key] = [flay];
		}
	});

	displaySummaryTableView(dataMap, $list);
});

$("#groupByPath").on('show.bs.collapse', function() {
	var getPathKey = function(files) {
		var file;
		if (files.movie.length > 0) {
			file = files.movie[0];
		} else {
			file = files.cover[0];
		}
		var pathArray = file.replace(/\\/gi, '/').split('/');
		pathArray.pop();
		var key = pathArray.join('/');
		if (key.indexOf('/Storage/') > -1) {
			pathArray.pop();
			key = pathArray.join('/');
		}
		return key;
	};
	var $list = $("#pathList").empty();

	var dataMap = {};
	$.each(flayList, function(idx, flay) {
		var key = getPathKey(flay.files);
		if (dataMap[key]) {
			dataMap[key].push(flay);
		} else {
			dataMap[key] = [flay];
		}
	});

	displaySummaryTableView(dataMap, $list);
});

$("#groupByRank").on('show.bs.collapse', function(e) {
	var $list = $("#rankList").empty();

	var dataMap = {};
	$.each(flayList, function(idx, flay) {
		var key = 'Rank ' + flay.video.rank;
		if (dataMap[key]) {
			dataMap[key].push(flay);
		} else {
			dataMap[key] = [flay];
		}
	});

	displaySummaryTableView(dataMap, $list);
});

$("#groupByStudio").on('show.bs.collapse', function() {
	var $list = $("#studioList").empty();

	var dataMap = {}, studioCount = 0;
	$.each(flayList, function(idx, flay) {
		var key = flay.studio;
		if (dataMap[key]) {
			dataMap[key].push(flay);
		} else {
			dataMap[key] = [flay];
			++studioCount;
		}
	});
	$(".studio-count").html(studioCount);

	var dataArray = [];
	$.each(dataMap, function(key, val) {
		if (val.length > filterCount) {
			dataArray.push({
				key: key,
				list: val
			});
		}
	});
	$.each(dataArray, function(idx, data) {
		var tagWeight = data.list.length > 100
				? 60
				: data.list.length < 20
						? 10
						: data.list.length/2;

		$("<a>", {
			'data-weight': Math.round(tagWeight)
		}).append(
				data.key + ' (' + data.list.length + ')'
		).on("click", function(e) {
			e.preventDefault();
			View.studio(data.key);
		}).appendTo($list);
	});
	$(".studio-count").html(dataArray.length + " / " + studioCount);
	$(".filter-count").html(filterCount);

	var wOpts = {
			interval: 20,
//			textFont: '"Ink Free", Impact,"Arial Black",sans-serif',
			textColour: '#00f',
			textHeight: 15,
			outlineColour: '#f96',
			outlineThickness: 5,
			outlineRadius: 4,
			maxSpeed: 0.03,
			minSpeed: 0.001,
			minBrightness: 0.1,
			depth: 0.92,
			pulsateTo: 0.2,
			pulsateTime: 0.75,
			initial: [0.1,-0.1],
			decel: 0.98,
			reverse: true,
			hideTags: false,
			shadow: '#ccf',
			shadowBlur: 3,
			shuffleTags: true,
			wheelZoom: true,
			clickToFront: 300,
			weight: true,
			weightMode: 'both',
			weightFrom: 'data-weight'
	};
	// http://www.goat1000.com/tagcanvas-weighted.php
	$('#studioCanvas').tagcanvas(wOpts, 'studioList');

}).on("hide.bs.collapse", function() {
	$('#studioCanvas').tagcanvas('delete');
});

$("#StudioTable").on('show.bs.collapse', function() {
	var dataMap = {}, studioCount = 0;
	$.each(flayList, function(idx, flay) {
		var key = flay.studio;
		if (dataMap[key]) {
			dataMap[key].push(flay);
		} else {
			dataMap[key] = [flay];
			++studioCount;
		}
	});

	var dataArray = [];
	$.each(dataMap, function(key, val) {
		if (val.length > filterCount) {
			dataArray.push({
				key: key,
				list: val
			});
		}
	});
	dataArray.sort(function(d1, d2) {
//		return d1.key.localeCompare(d2.key);
		return d2.list.length - d1.list.length;
	});

	$(".studio-count").html(dataArray.length + " / " + studioCount);
	$(".filter-count").html(filterCount);

	var $tbody = $("#studioTableWrap tbody").empty();
	$.each(dataArray, function(idx, data) {

		var flayLength = data.list.length;
		var flayFileSize = 0;
		var flayRankSum = 0;
		var flayRankLength = 0;
		var flayRankAvg = 0.0;
		var	favLength = 0;
		var favFileSize = 0;
		var favRankSum = 0;
		var favRankLength = 0;
		var favRankAvg = 0.0;
		var favRatio = 0.0;

		for (let flay of data.list) {
			flayFileSize += flay.length;
			if (flay.video.rank > 0) {
				flayRankSum += flay.video.rank;
				flayRankLength++;
			}
			if (isFavoriteActress(flay.actressList)) {
				favLength++;
				favFileSize += flay.length;
				if (flay.video.rank > 0) {
					favRankSum += flay.video.rank;
					favRankLength++;
				}
			}
		}

		flayRankAvg = flayRankSum / flayRankLength;
		favRankAvg = favRankSum / favRankLength;
		favRatio = Math.round(favLength / flayLength * 100) + "%";

		$("<tr>").append(
				$("<td>").html(data.key),
				$("<td>").html(flayLength),
				$("<td>").html(File.formatSize(flayFileSize)),
				$("<td>").html(flayRankAvg > 0 ? flayRankAvg.toFixed(1) : ''),

				$("<td>").html(favLength),
				$("<td>").html(File.formatSize(favFileSize)),
				$("<td>").html(favRankAvg > 0 ? favRankAvg.toFixed(1) : ''),
				$("<td>").html(favRatio)
		).on("click", function() {
			displayFlayList(data.key, data.list);
		}).appendTo($tbody);
	});

}).on("hide.bs.collapse", function() {
	$('#studioCanvas').tagcanvas('delete');
});

$("#groupByActress").on('show.bs.collapse', function() {
	var $list = $("#actressList").empty();

	var dataMap = {}, actressCount = 0;
	$.each(flayList, function(idx, flay) {
		var keys = flay.actressList;
		for (var x in keys) {
			if (keys[x] === 'Amateur') {
				continue;
			}
			if (dataMap[keys[x]]) {
				dataMap[keys[x]].push(flay);
			} else {
				dataMap[keys[x]] = [flay];
				++actressCount;
			}
		}
	});

	var dataArray = [];
	$.each(dataMap, function(key, val) {
		if (val.length > filterCount) {
			dataArray.push({
				key: key,
				list: val
			});
		}
	});
	$.each(dataArray, function(idx, data) {
		var tagWeight = data.list.length > 60
				? 60
				: data.list.length < 10
						? 9
						: data.list.length;

		$("<a>", {
			'data-weight': Math.round(tagWeight)
		}).append(
				data.key + ' (' + data.list.length + ')'
		).on("click", function(e) {
			e.preventDefault();
			View.actress(data.key);
		}).appendTo($list);
	});
	$(".actress-count").html(dataArray.length + " / " + actressCount);
	$(".filter-count").html(filterCount);

	var wOpts = {
			interval: 20,
			textColour: '#00f',
			textHeight: 15,
			outlineColour: '#f96',
			outlineThickness: 5,
			outlineRadius: 4,
			maxSpeed: 0.03,
			minSpeed: 0.001,
			minBrightness: 0.1,
			depth: 0.92,
			pulsateTo: 0.2,
			pulsateTime: 0.75,
			initial: [0.1,-0.1],
			decel: 0.98,
			reverse: true,
			hideTags: false,
			shadow: '#ccf',
			shadowBlur: 3,
			shuffleTags: true,
			wheelZoom: true,
			clickToFront: 300,
			weight: true,
			weightMode: 'both',
			weightFrom: 'data-weight'
	};

	$('#actressCanvas').tagcanvas(wOpts, 'actressList');

}).on("hide.bs.collapse", function() {
	$('#actressCanvas').tagcanvas('delete');
});

$("#ActressTable").on('show.bs.collapse', function() {
	var dataMap = {}, actressCount = 0;
	$.each(flayList, function(idx, flay) {
		var keys = flay.actressList;
		for (var x in keys) {
			if (keys[x] === 'Amateur') {
				continue;
			}
			if (dataMap[keys[x]]) {
				dataMap[keys[x]].push(flay);
			} else {
				dataMap[keys[x]] = [flay];
				++actressCount;
			}
		}
	});

	var dataArray = [];
	$.each(dataMap, function(key, val) {
		if (val.length > filterCount) {
			dataArray.push({
				key: key,
				list: val
			});
		}
	});
	dataArray.sort(function(d1, d2) {
//		return d1.key.localeCompare(d2.key);
		return d2.list.length - d1.list.length;
	});

	$(".actress-count").html(dataArray.length + " / " + actressCount);
	$(".filter-count").html(filterCount);

	var $tbody = $("#actressTableWrap tbody").empty();
	$.each(dataArray, function(idx, data) {

		var flayLength = data.list.length;
		var flayFileSize = 0;
		var filteredLength = 0;
		var filteredFileSize = 0;
		var filteredRankSum = 0;
		var filteredRankLength = 0;
		var filteredRankAvg = 0.0;

		for (let flay of data.list) {
			flayFileSize += flay.length;
			if (flay.video.rank > 0) {
				filteredLength++;
				filteredFileSize += flay.length;
				filteredRankSum += flay.video.rank;
				filteredRankLength++;
			}
		}

		filteredRankAvg = filteredRankSum / filteredRankLength;

		$("<tr>").append(
				$("<td>").html(data.key),
				$("<td>").html(flayLength),
				$("<td>").html(File.formatSize(flayFileSize)),
				$("<td>").html(filteredLength),
				$("<td>").html(File.formatSize(filteredFileSize)),
				$("<td>").html(filteredRankAvg > 0 ? filteredRankAvg.toFixed(1) : ''),

		).on("click", function() {
			displayFlayList(data.key, data.list);
		}).appendTo($tbody);
	});

}).on("hide.bs.collapse", function() {
	$('#studioCanvas').tagcanvas('delete');
});

function displaySummaryTableView(dataMap, $list) {
	const dataArray = [];
	const isReleaseView = $list.attr("id") === 'releasedList';
	let maxFlayCount = 0;
	let totalFlayCount = 0;
	let totalFlayLength = 0;
	let totalUnRankCount = 0;

	$.each(dataMap, function(key, val) {
		var fileLength = (function(flayList) {
			var length = 0;
			for (const flay of flayList) {
				length += flay.length;
			}
			return length;
		}(val));

		var unRank = (function(flayList) {
			var unRankCount = 0;
			for (const flay of flayList) {
				unRankCount += flay.video.rank === 0 ? 1 : 0;
			}
			return unRankCount;
		}(val));

		dataArray.push({
			key: key,
			list: val,
			length: fileLength,
			unRank: unRank
		});

		maxFlayCount = Math.max(maxFlayCount, val.length);
		totalFlayCount += val.length;
		totalFlayLength += fileLength;
		totalUnRankCount += unRank;
	});

	dataArray.sort(function(d1, d2) {
		return d2.key.localeCompare(d1.key);
	});

	console.table(dataArray);

	$.each(dataArray, function(idx, data) {
		const percent = data.list.length / totalFlayCount * 100;
		$("<tr>").append(
				$("<td>", {'class': 'item-key nowrap'}).append(
						$("<span>", {'class': 'hover'}).html(data.key).on("click", function() {
							displayFlayList(data.key, data.list);
						})
				),
				$("<td>", {'class': 'item-count'}).html((isReleaseView ? data.unRank + " / " : "") + data.list.length).css("text-align", isReleaseView ? "center" : "right"),
				$("<td>", {'class': 'item-length'}).html(File.formatSize(data.length)),
				$("<td>", {'class': 'item-progress'}).append(
						$("<div>", {'class': 'progress', title: (percent.toFixed(1) + "%")}).append(
								$("<div>", {'class': 'progress-bar'}).css({
									width: Math.max(percent, 1) + "%"
								}),
						),
				),
		).appendTo($list);
	});
	$list.next().empty().append(
			$("<th>"),
			$("<th>").html((isReleaseView ? totalUnRankCount + " / " : "") + totalFlayCount).css("text-align", isReleaseView ? "center" : "right"),
			$("<th>").html(File.formatSize(totalFlayLength)),
			$("<th>")
	);
}

function isFavoriteActress(nameArray) {
	for (let actress of actressList) {
		for (let name of nameArray) {
			if (actress.name === name) {
				return actress.favorite;
			}
		}
	}
	return false;
}

function displayFlayList(key, list) {
	$("#groupByKey").html(key);

	var $flayList = $("#flayList").empty();
	$.each(list, function(idx, flay) {
		$flayList.appendFlayCard(flay, {
			width: 310,
			exclude: [STUDIO, ACTRESS_EXTRA, MODIFIED, RANK, COMMENT, FILEINFO],
			fontSize: '80%'
		});
	});

	$(".flay-list-wrapper").show();
}

$("body").toggleClass("bg-dark", LocalStorageItem.get('flay.bgtheme', 'D') === 'D').css({backgroundColor: LocalStorageItem.get('flay.bgcolor')});
