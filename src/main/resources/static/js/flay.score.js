/**
 * flay.score.html
 */
(() => {
	var rankPoint = 0,
		playPoint = 0,
		subtitlesPoint = 0,
		storageLimit = 0;
	var actressMap = new Map();
	var actressList = [];

	Rest.Actress.list((list) => {
		actressList = list;
	});

	restCall("/config", {}, function (config) {
		rankPoint = config.score.rankPoint;
		playPoint = config.score.playPoint;
		subtitlesPoint = config.score.subtitlesPoint;
		storageLimit = config.storageLimit * GB;
	});

	$(document).ready(function () {
		var bgThemeValue = LocalStorageItem.get("flay.bgtheme", "D");

		loading.on("Loading data");
		restCall("/flay/list/orderbyScoreDesc", {}, function (flayList) {
			var $flayList = $(".f-body");
			var lengthSum = 0;
			$.each(flayList, function (idx, flay) {
				lengthSum += flay.length;
				$("<div>", { id: flay.opus, class: "d-flex" + (lengthSum > storageLimit ? "bg-secondary" : "") })
					.append(
						$("<div>", { class: "index" }).append(idx + 1),
						$("<div>", { class: "opus" }).append(
							$("<a>", { class: "hover" })
								.on("click", function () {
									View.flay(flay.opus);
								})
								.html(flay.opus),
						),
						$("<div>", { class: "title nowrap flex-grow-1" }).append(
							$("<span>", { class: "hover" })
								.html(flay.title)
								.click(function (e) {
									$("#coverWrap > img").attr("src", "/static/cover/" + flay.opus);
									$("#coverWrap").show();
								}),
						),
						$("<div>", { class: "actress nowrap flex-grow-1" }).append(Util.Actress.get(flay.actressList, "mx-1 hover")),
						$("<div>", { class: "release" }).append(flay.release),
						$("<div>", { class: "modified" }).append(DateUtils.format("yy/MM/dd", flay.lastModified)),
						$("<div>", { class: "rank" }).append(flay.video.rank),
						$("<div>", { class: "play" + (flay.video.play === 0 ? " text-danger" : "") }).append(flay.video.play),
						$("<div>", { class: "movie" }).append(flay.files.movie.length),
						$("<div>", { class: "subti" }).append(flay.files.subtitles.length),
						$("<div>", { class: "score" }).append(flay.video.rank * rankPoint + flay.video.play * playPoint + (flay.files.subtitles.length > 0 ? 1 : 0) * subtitlesPoint),
						$("<div>", { class: "length" }).append(File.formatSize(flay.length, "GB")),
						$("<div>", { class: "total" }).append(File.formatSize(lengthSum, "GB", 0)),
					)
					.on("click", function () {
						$(this).parent().children().removeClass("active");
						$(this).addClass("active");
					})
					.appendTo($flayList);

				$.each(flay.actressList, function (i, actress) {
					if (!actressMap.has(actress)) {
						actressMap.set(actress, new Array());
					}
					actressMap.get(actress).push(flay);
				});
			});

			$("#flayCount").html(flayList.length);
			$("#actressCount").html(actressMap.size);

			// draw actress map
			let actressByScore = [];
			for (var [name, flayArray] of actressMap) {
				let actress = getActressInfo(name);
				let score = getScore(flayArray);
				actress["flayCount"] = flayArray.length;
				actress["scoreTotal"] = score.total;
				actress["scoreAvg"] = score.avg;

				actressByScore.push(actress);
			}
			actressByScore.sort(function (a1, a2) {
				return a2.scoreAvg - a1.scoreAvg;
			});
			$.each(actressByScore, (idx, actress) => {
				$("#actressView").append(
					$("<div>").append(
						$("<label>", { class: "text actress-no" }).html(idx + 1),
						$("<label>", { class: "text actress-scoreTotal" }).html(actress.scoreTotal + " <small>tot</small>"),
						$("<label>", { class: "text actress-flaycount" }).html(actress.flayCount + " <small>f</small>"),
						$("<label>", { class: "text actress-scoreAvg" }).html(actress.scoreAvg.toFixed(0) + " <small>avg</small>"),
						$("<label>", { class: "text actress-favorite" }).append($("<i>", { class: "fa fa-heart" + (actress.favorite ? " favorite" : "-o") })),
						$("<label>", { class: "text actress-name" }).append(
							$("<a>", { class: "hover" })
								.on("click", { name: actress.name }, function (e) {
									View.actress(e.data.name);
								})
								.html(actress.name),
						),
						$("<label>", { class: "text actress-local" }).html(actress.localName),
						$("<label>", { class: "text actress-age" }).html(Util.Actress.getAge(actress).ifNotZero("<small>y</small>")),
						$("<label>", { class: "text actress-birth" }).html(
							actress.birth.replace(/年|月|日/g, function (match, offset, string) {
								return "<small>" + match + "</small>";
							}),
						),
						$("<label>", { class: "text actress-body" }).html(
							actress.body.replace(/ - /g, function (match) {
								return "<small>" + match.trim() + "</small>";
							}),
						),
						$("<label>", { class: "text actress-height" }).html(actress.height.ifNotZero("<small>cm</small>")),
						$("<label>", { class: "text actress-debut" }).html(actress.debut.ifNotZero()),
					),
				);
			});

			$("input[name='viewType']").on("change", function () {
				viewType = $("input[name='viewType']:checked").val();
				if (viewType === "f") {
					$("#flayView").show();
					$("#actressView").hide();
				} else if (viewType === "a") {
					$("#flayView").hide();
					$("#actressView").show();
				}
			});

			$("input[name='viewType'][value='a']").parent().click();

			loading.off();
		});

		$("#unPlay").on("change", function () {
			var checked = this.checked;
			$(".f-body .play").each(function (idx, dom) {
				var $dom = $(dom);
				if (checked) {
					if ($dom.text() !== "0") {
						$dom.parent().removeClass("d-flex").hide();
					}
				} else {
					$dom.parent().show().addClass("d-flex");
				}
			});
		});
	});

	function getScore(flayList) {
		let score = { total: 0, avg: 0 };
		$.each(flayList, function (idx, flay) {
			score.total += flay.video.rank * rankPoint + flay.video.play * playPoint + (flay.files.subtitles.length > 0 ? 1 : 0) * subtitlesPoint;
		});
		score.avg = parseInt(score.total / flayList.length);
		return score;
	}
	function getActressInfo(name) {
		for (let actress of actressList) {
			if (actress.name === name) {
				return actress;
			}
		}
		return null;
	}
})();
