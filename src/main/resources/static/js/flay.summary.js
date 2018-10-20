/**
 * 
 */

var flayList = [];
Rest.Flay.list(function(list) {
	flayList = list;
});

$(window).on("resize", function() {
	console.log("$(window).width()", $(window).width());
//	$('canvas').attr("width", $(".card-body").width() - 64);
}).trigger("resize");

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
		if (key.indexOf('J:/Crazy/Storage/') > -1) {
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

$("#groupByRank").on('show.bs.collapse', function() {
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

	//	displaySummaryItem(dataMap, $list);

	var dataArray = [];
	$.each(dataMap, function(key, val) {
		dataArray.push({
			key: key,
			list: val
		});
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
				data.key
		).on("click", function(e) {
			e.preventDefault();
		}).appendTo($list);
	});

	var wOpts = {
			interval: 20,
//			textFont: 'Impact,"Arial Black",sans-serif',
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

	var dataArray = [], filterCount = 4;
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
				data.key,
//				"<br>",
//				data.list.length + "v"
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

function displaySummaryTableView(dataMap, $list) {
	var dataArray = [];
	var maxLength = 0;
	$.each(dataMap, function(key, val) {
		var length = (function() {
			var length = 0;
			for (var x in val) {
				length += val[x].length;
			}
			return length;
		}());
		dataArray.push({
			key: key,
			list: val,
			length: length 
		});
		maxLength = Math.max(maxLength, length);
	});
	
	dataArray.sort(function(d1, d2) {
		return d1.key.localeCompare(d2.key);
	});
	
	var totalFlayCount = 0, totalFlayLength = 0;
	$.each(dataArray, function(idx, data) {
		totalFlayCount += data.list.length;
		totalFlayLength += data.length;
		$("<tr>").append(
				$("<td>", {'class': 'item-key hover'}).html(data.key).on("click", function() {
					displayFlayList(data.key, data.list);
				}),
				$("<td>", {'class': 'item-count'}).html(data.list.length),
				$("<td>", {'class': 'item-length'}).html(File.formatSize(data.length)),
				$("<td>", {'class': 'item-progress'}).append(
						$("<div>", {'class': 'progress'}).append(
								$("<div>", {'class': 'progress-bar'}).css({
									width: Math.round(data.length / maxLength * 100) + "%"
								})
						)
				)
		).appendTo($list);
	});	
	$list.next().empty().append(
			$("<th>"),
			$("<th>").html(totalFlayCount),
			$("<th>").html(File.formatSize(totalFlayLength)),
			$("<th>")
	);
}

function displaySummaryItem(dataMap, $list) {
	var dataArray = [];
	$.each(dataMap, function(key, val) {
		dataArray.push({
			key: key,
			list: val
		});
	});
	dataArray.sort(function(d1, d2) {
		return d1.key.localeCompare(d2.key);
	});
	
	$.each(dataArray, function(idx, data) {
		$("<div>", {'class': 'summary-item'}).append(
				$("<label>", {'class': 'item-key nowrap'}).html(data.key),
				$("<span>",  {'class': 'item-count badge badge-primary'}).html(data.list.length),
				$("<label>", {'class': 'item-size'}).append(
						(function() {
							var length = 0;
							for (var x in data.list) {
								length += data.list[x].length;
							}
							return File.formatSize(length);
						}())
				)
		).on("click", function() {
			displayFlayList(data.key, data.list);
		}).appendTo($list);
	});	
}

function displayFlayList(key, list) {
	$("#groupByKey").html(key);

	var $flayList = $("#flayList").empty();
	$.each(list, function(idx, flay) {
		$flayList.appendFlayCard(flay, {
			width: 300,
			exclude: [ACTRESS_EXTRA, MODIFIED, RANK, COMMENT, FILEINFO],
			fontSize: '80%'
		});
	});

	$(".flay-list-wrapper").show();
}
