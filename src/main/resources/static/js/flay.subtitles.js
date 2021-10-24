const noSubtitlesOpusList = new Array();
let intervalFindSubtitles = -1;
let foundSubtitlesCount = 0;

const processStart = () => {
	let currentFindingIndex = 0;
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
					$sub.append(`<a href="javascript: Popup.open('${url}', '', 800, 1200);"><i class="fa fa-external-link mx-1"></i></a>`);
				}
			} else {
				// not found
				$sub.html(`<span class="text-secondary">not found</span>`);
			}
		});
		// scroll move
		if (currentFindingIndex % 30 === 1) {
			// location.href = "#" + opus;
			$("html, body").animate({ scrollTop: $("#" + opus).position().top }, 1000);
		}
	};

	// initiate
	$("#btnStopFinding").show();
	$("#btnFindSubtitles, #btnFilterFound").hide();
	$("#foundSubtitlesCount").html("0");
	$(".flay-item").removeClass("found-subtitles");
	$(".flay-subtitles").empty();
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
	$("#btnStopFinding").hide();
	$("#btnFindSubtitles, #btnFilterFound").show();
};

Rest.Flay.list((list) => {
	let count = 0;
	// sorting by release
	list.sort((a, b) => b.release.localeCompare(a.release)).forEach((flay) => {
		if (flay.files.subtitles.length > 0) {
			return;
		}
		// test limit
		// if (count > 900) return;

		noSubtitlesOpusList.push(flay.opus);

		const html = `<div class="flay-item" id="${flay.opus}">
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

	$("#flayCount").html(count); // mark total count
});

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
