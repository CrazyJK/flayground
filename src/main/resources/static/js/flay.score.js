/**
 * flay.score.html
 */
(() => {
	"use strict";

	let rankPoint = 0,
		playPoint = 0,
		subtitlesPoint = 0,
		storageLimit = 0;

	let actressList = [];
	const actressMap = new Map();

	$("#overlay").toggle(true);

	restCall("/config", {}, function (config) {
		rankPoint = config.score.rankPoint;
		playPoint = config.score.playPoint;
		subtitlesPoint = config.score.subtitlesPoint;
		storageLimit = config.storageLimit * GB;

		console.log("config", config);
		$("#storageLimit").html(config.storageLimit);
	});

	Rest.Actress.list((list) => {
		actressList = list;

		restCall("/flay/list/orderbyScoreDesc", {}, displayView);
	});

	function calcScore(flay) {
		return flay.video.rank * rankPoint + flay.video.play * playPoint + (flay.files.subtitles.length > 0 ? 1 : 0) * subtitlesPoint;
	}

	function getScoreOfAll(flayList) {
		let score = { total: 0, avg: 0 };
		$.each(flayList, function (idx, flay) {
			score.total += calcScore(flay);
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
		return {};
	}

	function getFlayRecordObject(idx, flay, lengthSum) {
		return $("<div>", { id: flay.opus, class: lengthSum > storageLimit ? "lower-score" : "" })
			.append(
				$("<label>", { class: "flay-index" }).append(idx + 1),
				$("<label>", { class: "flay-opus" }).append(
					$("<span>", { class: "hover" })
						.on("click", function () {
							View.flay(flay.opus);
						})
						.html(flay.opus),
				),
				$("<label>", { class: "flay-title nowrap" }).append(
					$("<span>", { class: "hover" })
						.html(flay.title)
						.click(function (e) {
							$("#coverWrap > img").attr("src", "/static/cover/" + flay.opus);
							$("#coverWrap").show();
						}),
				),
				$("<label>", { class: "flay-actress nowrap" }).append(Util.Actress.get(flay.actressList, "mx-1 hover")),
				$("<label>", { class: "flay-release" }).append(flay.release),
				$("<label>", { class: "flay-modified" }).append(DateUtils.format("yy/MM/dd", flay.lastModified)),
				$("<label>", { class: "flay-rank" }).append(flay.video.rank),
				$("<label>", { class: "flay-play" }).append(flay.video.play),
				$("<label>", { class: "flay-movie" }).append(flay.files.movie.length),
				$("<label>", { class: "flay-subti" }).append(flay.files.subtitles.length),
				$("<label>", { class: "flay-score" }).append(calcScore(flay)),
				$("<label>", { class: "flay-length" }).append(File.formatSize(flay.length, "GB")),
				$("<label>", { class: "flay-total" }).append(File.formatSize(lengthSum, "GB", 0)),
			)
			.on("click", function () {
				$(this).parent().children().removeClass("active");
				$(this).addClass("active");
			});
	}

	function getActressRecordObject(idx, actress) {
		return $("<div>", { "data-favorite": actress.favorite })
			.append(
				$("<label>", { class: "actress-no" }).html(idx + 1),
				$("<label>", { class: "actress-scoreTotal" }).html(actress.scoreTotal),
				$("<label>", { class: "actress-flayCount" }).html(actress.flayCount),
				$("<label>", { class: "actress-scoreAvg" }).html(actress.scoreAvg.toFixed(0)),
				$("<label>", { class: "actress-favorite" }).append($("<i>", { class: "fa fa-heart" + (actress.favorite ? " favorite" : "-o") })),
				$("<label>", { class: "actress-name nowrap" }).append(
					$("<span>", { class: "hover" })
						.on("click", { name: actress.name }, function (e) {
							View.actress(e.data.name);
						})
						.html(actress.name),
				),
				$("<label>", { class: "actress-local nowrap" }).html(actress.localName),
				$("<label>", { class: "actress-age" }).html(Util.Actress.getAge(actress).ifNotZero("<small>y</small>")),
				$("<label>", { class: "actress-birth" + (birthRegExp.test(actress.birth) ? "" : " invalid") }).html(
					actress.birth.replace(/年|月|日/g, function (match, offset, string) {
						return "<small>" + match + "</small>";
					}),
				),
				$("<label>", { class: "actress-body" + (bodyRegExp.test(actress.body) ? "" : " invalid") }).html(
					actress.body.replace(/ - /g, function (match) {
						return "<small>" + match.trim() + "</small>";
					}),
				),
				$("<label>", { class: "actress-height" + (heightRegExp.test(actress.height) ? "" : " invalid") }).html(actress.height.ifNotZero("<small>cm</small>")),
				$("<label>", { class: "actress-debut" + (debutRegExp.test(actress.debut) ? "" : " invalid") }).html(actress.debut.ifNotZero()),
			)
			.on("click", function () {
				$(this).parent().children().removeClass("active");
				$(this).addClass("active");
			});
	}

	function displayView(flayList) {
		let lengthSum = 0;
		$.each(flayList, (idx, flay) => {
			lengthSum += flay.length;
			$("#flayView .f-body").append(getFlayRecordObject(idx, flay, lengthSum));

			// collect actress map
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
			let score = getScoreOfAll(flayArray);
			actress["flayCount"] = flayArray.length;
			actress["scoreTotal"] = score.total;
			actress["scoreAvg"] = score.avg;
			actressByScore.push(actress);

			if (name === "Haruka Namiki") {
				console.log(actress);
			}
		}
		actressByScore.sort(function (a1, a2) {
			return a2.scoreAvg - a1.scoreAvg;
		});
		$.each(actressByScore, (idx, actress) => {
			$("#actressView .f-body").append(getActressRecordObject(idx, actress));
		});

		$("input[name='viewType']").on("change", function () {
			const viewType = $(this).val();
			if (viewType === "f") {
				$("#flayView").show();
				$("#actressView").hide();
			} else if (viewType === "a") {
				$("#flayView").hide();
				$("#actressView").show();
			}
		});
		$("input[name='viewType'][value='f']").parent().click();

		$("#overlay").toggle(false);
	}

	// event listener
	// only lower score view
	$("#lowerScore").on("change", function () {
		var checked = this.checked;
		console.log("lowerScore", checked);
		$("#flayView > .f-body > div:not(.lower-score)").toggle(!checked);
		$("#flayCount").html($("#flayView > .f-body > div:visible").length);
	});
	// only favorite actress view
	$("#actressView > .f-head > div > .actress-favorite").on("click", () => {
		$("#actressView > .f-body > div[data-favorite='false']").toggle();
		$("#actressCount").html($("#actressView > .f-body > div:visible").length);
	});

	$(window).on("keyup", (e) => {
		// console.log("key", e.keyCode);
		// arrow up(38), down(40)
		if (e.keyCode === 40 || e.keyCode === 38) {
			const $active = $(".f-body > div.active");
			if ($active.length > 0) {
				if ($("#coverWrap").is(":visible")) {
					if (e.keyCode === 38) {
						$active.prev().find(".flay-title > span").click();
					} else if (e.keyCode === 40) {
						$active.next().find(".flay-title > span").click();
					}
				} else {
					if (e.keyCode === 38) {
						$active.prev().click();
					} else if (e.keyCode === 40) {
						$active.next().click();
					}
				}
			}
		}
	});
})();
