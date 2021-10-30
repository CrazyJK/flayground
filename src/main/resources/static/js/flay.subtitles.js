"use strict";

(() => {
	let noSubtitlesOpusList = new Array();
	let intervalFindSubtitles = -1;
	let foundSubtitlesCount = 0;
	let currentFindingIndex = 0;
	let flayList = [];

	Rest.Flay.list((list) => {
		flayList = list;
	});

	const processStart = () => {
		const findSubtitles = () => {
			const opus = noSubtitlesOpusList[currentFindingIndex++];
			const $sub = $("#" + opus + " > .flay-subtitles").html("finding..."); // mark current active
			Search.subtitlesUrlIfFound(opus, (list) => {
				// console.log("found result", opus, list.length);

				if (list.length > 0) {
					// found subtitles
					foundSubtitlesCount++;

					$sub.empty().closest(".flay-item").addClass("found-subtitles");
					$("#foundSubtitlesCount").html(foundSubtitlesCount); // mark found count

					// add found link
					for (const url of list) {
						$sub.append(`
							<a href="${url}" onclick="removeThis(this);">
								<i class="fa fa-external-link mx-1"></i>
							</a>`);
					}
				} else {
					// not found
					$sub.html(`<span class="text-secondary">not found</span>`);
				}
			});
			// scroll move
			if (currentFindingIndex % 30 === 1) {
				// location.href = "#" + opus;
				$("html, body").animate({ scrollTop: $("#" + opus).position().top }, 500);
			}
		};

		// initiate
		$("#btnStopFinding").show();
		$("#btnFindSubtitles, #btnFilterFound").hide();
		$("#foundSubtitlesCount").html("0");
		intervalFindSubtitles = -1;
		foundSubtitlesCount = 0;

		// first call
		findSubtitles();

		// interval call
		intervalFindSubtitles = setInterval(() => {
			findSubtitles();
			if (noSubtitlesOpusList.length === currentFindingIndex) {
				processStop();
			}
		}, 500);
	};

	const processStop = () => {
		clearInterval(intervalFindSubtitles);
		if (noSubtitlesOpusList.length === currentFindingIndex) {
			$("#btnFindSubtitles, #btnStopFinding").hide();
		} else {
			$("#btnFindSubtitles").html("Resume");
		}
		$("#btnStopFinding").hide();
		$("#btnFindSubtitles, #btnFilterFound").show();
	};

	const displayList = (e) => {
		// filter rank
		const selectedRank = [];
		$("input:checkbox[name='rank']:checked").each((index, rank) => {
			selectedRank.push(Number(rank.value));
		});

		// initiate
		$("#btnFindSubtitles").show().html("Find");
		$("#btnStopFinding").hide();
		$("#btnFilterFound").hide();
		$("#flayList").empty();
		noSubtitlesOpusList = new Array();
		currentFindingIndex = 0;

		// sorting by release
		flayList
			.filter((flay) => {
				return flay.files.subtitles.length === 0 && selectedRank.includes(flay.video.rank);
			})
			.sort((a, b) => {
				const c1 = b.video.rank - a.video.rank;
				return c1 === 0 ? b.release.localeCompare(a.release) : c1;
			})
			.forEach((flay, count) => {
				noSubtitlesOpusList.push(flay.opus);

				const html = `<div class="flay-item" id="${flay.opus}" rank="${flay.video.rank}">
								<label class="flay-count">${++count}</label>
								<label class="flay-studio">${flay.studio}</label>
								<label class="flay-opus">${flay.opus}</label>
								<label class="flay-title hover" onclick="View.flay('${flay.opus}')">${flay.title}</label>
								<label class="flay-actressList">${flay.actressList}</label>
								<label class="flay-release">${flay.release}</label>
								<label class="flay-rank">${flay.video.rank > 0 ? flay.video.rank : ""}</label>
								<label class="flay-subtitles"></label>
							</div>`;

				$("#flayList").append(html);
			});

		$("#flayCount").html(noSubtitlesOpusList.length); // mark total count
	};

	// start find
	$("#btnFindSubtitles").on("click", processStart);

	// stop find
	$("#btnStopFinding").on("click", processStop);

	// filter found subtitles
	$("#btnFilterFound").on("click", () => {
		$(".flay-item:not(.found-subtitles)").toggle();
	});

	// click subtiles link
	$("#flayList").on("click", ".flay-subtitles > a", (e) => {
		$(e.target).closest(".flay-item").addClass("active-subtitles");
	});

	$("input:checkbox[name='rank']").on("change", displayList).trigger("change");
})();

function removeThis(that) {
	$(that).remove();
}
