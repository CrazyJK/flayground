/**
 * flay.score.html
 */
var rankPoint = 0, playPoint = 0, subtitlesPoint = 0, storageLimit = 0;
var actressInfo = {};

restCall('/config', {}, function(config) {
	rankPoint = config.score.rankPoint;
	playPoint = config.score.playPoint;
	subtitlesPoint = config.score.subtitlesPoint;
	storageLimit = config.storageLimit * GB;
});

$(document).ready(function() {
	
	var bgThemeValue = LocalStorageItem.get('flay.bgtheme', 'D');
	$("body").toggleClass("bg-dark", bgThemeValue === 'D').css({backgroundColor: bgThemeValue === 'D' ? LocalStorageItem.get('flay.bgcolor') : ""});

	loading.on("Loading data");
	restCall('/flay/list/orderbyScoreDesc', {}, function(flayList) {
		var $flayList = $(".f-body");
		var lengthSum = 0;
		$.each(flayList, function(idx, flay) {
			lengthSum += flay.length;
			$("<div>", {id: flay.opus, class: 'd-flex' + (lengthSum > storageLimit ? 'bg-secondary' : '')}).append(
					$("<div>", {class: 'index'}).append((idx + 1)),
					$("<div>", {class: 'opus'}).append(
							$("<a>", {class: 'hover'}).on("click", function() {
								View.flay(flay.opus);
							}).html(flay.opus)
					),
					$("<div>", {class: 'title nowrap flex-grow-1'}).append(
							$("<span>", {class: 'hover'}).html(flay.title).click(function(e) {
								$("#coverWrap > img").attr("src", "/static/cover/" + flay.opus);
								$("#coverWrap").show();
							})
					),
					$("<div>", {class: 'actress nowrap flex-grow-1'}).append(Util.Actress.get(flay.actressList, 'mx-1 hover')),
					$("<div>", {class: 'release'}).append(flay.release),
					$("<div>", {class: 'modified'}).append(DateUtils.format("yy/MM/dd", flay.lastModified)),
					$("<div>", {class: 'rank'}).append(flay.video.rank),
					$("<div>", {class: 'play' + (flay.video.play === 0 ? ' text-danger' : '')}).append(flay.video.play),
					$("<div>", {class: 'movie'}).append(flay.files.movie.length),
					$("<div>", {class: 'subti'}).append(flay.files.subtitles.length),
					$("<div>", {class: 'score'}).append(
							flay.video.rank * rankPoint + 
							flay.video.play * playPoint +
							(flay.files.subtitles.length > 0 ? 1 : 0) * subtitlesPoint
					),
					$("<div>", {class: 'length'}).append(File.formatSize(flay.length, 'GB')),
					$("<div>", {class: 'total'}).append(File.formatSize(lengthSum, 'GB', 0))
			).on("click", function() {
				$(this).parent().children().removeClass("active");
				$(this).addClass("active")
			}).appendTo($flayList);

			$.each(flay.actressList, function(i, actress) {
				if (!actressInfo[actress]) {
					actressInfo[actress] = [];
				}
				actressInfo[actress].push(flay);
			});
		});
		
		var CARD_WIDTH = 330;
		var actressCount = 0;
		$.each(actressInfo, function(key, val) {
			actressCount++;
			$("#actressGroup").append(
					$("<div>", {class: 'm-1 px-2 py-1 border rounded align-self-baseline shadow'}).append(
							$("<div>").append(
									$("<button>", {'data-toggle': 'collapse', 'data-target': '.' + key.replace(/ /gi, ""), class: 'bg-transparent border-0'}).html(key).append(
											$("<span>", {class: 'badge badge-fill'}).html(val.length)
									),
									$("<i>", {class: 'fa fa-female ml-1 hover'}).on("click", function() {
										View.actress(key);
									})
							).animate({
								fontSize: 14 + val.length * 1
							}),
							$("<div>", {class: "collapse " + key.replace(/ /gi, "")}).append(
									(function(list) {
										var ret = [];
										$.each(list, function(idx, flay) {
											var $flayCard = $("<div>", {class: 'hover m-1 rounded border card flay-card'}).css({
												width: CARD_WIDTH,
												height: CARD_WIDTH * 0.6625,
												display: 'inline-block',
												backgroundImage: 'url(/static/cover/' + flay.opus + ')',
												backgroundSize: 'cover'
											}).on("click", function() {
												View.flay(flay.opus);
											}).append(
													$("<label>", {class: 'nowrap text lg'}).html(flay.title).css({
														width: 'calc(100% - 8px)'
													})
											);
											ret.push($flayCard);
										});
										return ret;
									})(val)
							)
					)
			);
		});
		$("#actressCount").html(actressCount);
		$("#flayCount").html(flayList.length);
		
		$("input[name='viewType']").on("change", function() {
			viewType = $("input[name='viewType']:checked").val();
			if (viewType === 't') {
				$("#tableView").show();
				$("#cardView").hide();
			} else if (viewType === 'c') {
				$("#tableView").hide();
				$("#cardView").show();
			}
		});

		$("input[name='viewType'][value='t']").parent().click();
		
		loading.off();
	});
	
	$("#unPlay").on("change", function() {
		var checked = this.checked;
		$(".f-body .play").each(function(idx, dom) {
			var $dom = $(dom);
			if (checked) {
				if ($dom.text() !== '0') {					
					$dom.parent().removeClass("d-flex").hide();
				}
			} else {
				$dom.parent().show().addClass("d-flex");
			}
		});
	});

});
