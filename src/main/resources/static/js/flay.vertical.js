/**
 * Video Vertical View Javascript
 */

var videoList = [];
var tagList = [];
var actressList = [];
var collectedList = [];

var currentFlay = null;
var currentIndex = -1;

var slideTimer;
var keyInputQueue = "";
var keyLastInputTime = new Date().getTime();
var collecting = false;

$(document).ready(function () {
	attachEventListener();

	loadData();
});

function loadData() {
	var tagLoaded = false,
		flayLoaded = false,
		actressLoaded = false;
	var deploy = () => {
		if (tagLoaded && flayLoaded && actressLoaded) {
			let tagArray = [];
			$.each(tagList, (i, tag) => {
				tagArray.push(createTag(tag));
			});
			$(".tag-list > label:not(.label-add-tag)").remove();
			$(".tag-list").prepend(tagArray);
			$("#pageContent").trigger("collect");
		}
	};

	// load tag list
	Rest.Tag.list(function (list) {
		tagList = list;
		Util.Tag.sort(tagList);
		tagLoaded = true;
		deploy();
	});

	// load video list
	Rest.Flay.list(function (list) {
		videoList = list;
		flayLoaded = true;
		deploy();
	});

	// load actress list
	Rest.Actress.list(function (list) {
		actressList = list;
		actressLoaded = true;
		deploy();
	});
}

var createTag = (tag) => {
	return $("<label>", { class: "check sm" }).append($("<input>", { type: "checkbox", "data-tag-id": tag.id }).data("tag", tag), $("<span>", { title: tag.description }).html(tag.name));
};

$.fn.appendTag = function (tagList, tag) {
	return this.each(function () {
		var $this = $(this);
		if (tagList) {
			$.each(tagList, (i, tag) => {
				$this.append(createTag(tag));
			});
		}
		if (tag) {
			$this.append(createTag(tag));
		}
	});
};

function attachEventListener() {
	// header tag select event
	$("#selectTags").on("change", "input[data-tag-id]", function () {
		if ($("#tagPopup").prop("checked")) {
			var tagId = $(this).data("tag").id;
			View.tag(tagId);
			this.checked = !this.checked;
		} else {
			var checkedLength = $("#selectTags").find("input[data-tag-id]:checked").length;
			$("#tagCheck").prop("checked", checkedLength > 0);
			$("#pageContent").trigger("collect");
		}
	});

	// body tag event
	$("#videoTags").on("change", "input[data-tag-id]", function () {
		var $this = $(this);
		var isChecked = $this.prop("checked");
		var toggledTag = $this.data("tag");
		if (isChecked) {
			Util.Tag.push(currentFlay.video.tags, toggledTag);
		} else {
			Util.Tag.remove(currentFlay.video.tags, toggledTag);
		}
		Rest.Video.update(currentFlay.video);
	});

	// new tag save
	$(".btn-tag-save").on("click", function () {
		var newTagName = $("#newTagName").val(),
			newTagDesc = $("#newTagDesc").val();
		if (newTagName != "") {
			var newTag = { name: newTagName, description: newTagDesc };
			Rest.Tag.create(newTag, function (createdTag) {
				Util.Tag.push(currentFlay.video.tags, createdTag);
				Rest.Video.update(currentFlay.video, function () {
					$("#selectTags > .tag-list").appendTag(null, createdTag);
					$("#videoTags").appendTag(null, createdTag);
					$("input[data-tag-id='" + createdTag.id + "']", "#videoTags").prop("checked", true);
					$("#newTagName, #newTagDesc").val("");
				});
			});
		}
	});

	// uncheck select Tag
	$("#tagCheck").on("change", function () {
		var count = $("input[data-tag-id]:checked", "#selectTags").length;
		if (count > 0) {
			$("input[data-tag-id]:checked", "#selectTags").prop("checked", false);
			$("#pageContent").trigger("collect");
		} else {
			this.checked = false;
		}
	});

	// query
	$("#search").on("keyup", function (e) {
		e.stopPropagation();
		if (e.keyCode == 13) {
			$("#pageContent").trigger("collect");
		}
	});

	// filter, rank & sort condition
	$("#favorite, #video, #subtitles, #rank0, #rank1, #rank2, #rank3, #rank4, #rank5, input[name='sort']").on("change", collectList);

	// video label event
	addVideoEvent();

	// navigation event
	navigation.event();

	// auto slide
	$("#autoSlide").on("change", function () {
		if (this.checked) {
			navigation.slide.on();
		} else {
			navigation.slide.off();
		}
	});

	// toggle tags
	$("#tags").on("change", function () {
		$("#selectTags").slideToggle(this.checked);
	});
	// statistics studio
	$("#toggleStatisticsStudio").on("change", function () {
		$("#statisticsStudio").slideToggle(this.checked);
	});
	// statistics actress
	$("#toggleStatisticsActress").on("change", function () {
		$("#statisticsActress").slideToggle(this.checked);
	});

	// collect
	$("#pageContent").on("collect", function () {
		!collecting && collectList();
	});

	// data reload
	$(".btn-reload").on("click", function () {
		loadData();
	});

	// toggle option
	$(".toggle-option").on("click", function (e) {
		$("#options")
			.css({ left: e.clientX - $("#options").width() })
			.slideToggle(150);
	});

	// window resize
	$(window)
		.on("resize", function () {
			var windowWidth = $(window).width();
			// var windowHeight = $(window).height();
			var navHeight = $("nav.navbar").outerHeight();
			var currCoverBoxWidth = $(".cover-wrapper-inner.curr > .cover-box").width();
			var currCoverBoxHeight = $(".cover-wrapper-inner.curr > .cover-box").height();

			var calcWidth = (windowWidth - currCoverBoxWidth - 20) / 2;
			var calcHeight = calcWidth * COVER_RATIO;
			var $sideCover = $(".cover-wrapper-inner.prev > .cover-box, .cover-wrapper-inner.next > .cover-box");
			if (currCoverBoxWidth / 2 > calcWidth) {
				// too small, hide
				$sideCover.hide();
			} else if (currCoverBoxWidth < calcWidth) {
				// too large, set default
				$sideCover
					.css({
						width: currCoverBoxWidth,
						height: currCoverBoxHeight,
					})
					.show();
			} else {
				$sideCover
					.css({
						width: calcWidth,
						height: calcHeight,
					})
					.show();
			}
		})
		.trigger("resize");
}

function collectList() {
	var compareTo = function (data1, data2) {
			var result = 0;
			if (typeof data1 === "number") {
				result = data1 - data2;
			} else if (typeof data1 === "string") {
				result = data1.toLowerCase().localeCompare(data2.toLowerCase());
			} else if (typeof data1 === "object") {
				// maybe actressList
				result = Util.Actress.getNames(data1).localeCompare(Util.Actress.getNames(data2));
			} else {
				result = data1 > data2 ? 1 : -1;
			}
			return result;
		},
		matchTag = function (tag, flay) {
			if (flay.video.tags.includes(tag.id)) {
				// id
				return true;
			} else if (flay.fullname.indexOf(tag.name) > -1) {
				// name
				return true;
			} else {
				// description
				var descArray = tag.description.split(",");
				if (descArray.length > 0) {
					for (var y in descArray) {
						var desc = descArray[y].trim();
						if (desc.length > 0) {
							if (flay.fullname.indexOf(desc) > 0) {
								return true;
							}
						}
					}
				}
			}
			return false;
		},
		getActress = function (name) {
			for (var x in actressList) {
				if (actressList[x].name === name) {
					return actressList[x];
				}
			}
		};

	collecting = true;
	loading.on("Collect list");
	$(".video-wrapper").hide();

	var query = $("#search").val();
	var fav = $("#favorite").prop("checked");
	var vid = $("#video").prop("checked");
	var sub = $("#subtitles").prop("checked");
	var rank0 = $("#rank0").prop("checked") ? "0" : "";
	var rank1 = $("#rank1").prop("checked") ? "1" : "";
	var rank2 = $("#rank2").prop("checked") ? "2" : "";
	var rank3 = $("#rank3").prop("checked") ? "3" : "";
	var rank4 = $("#rank4").prop("checked") ? "4" : "";
	var rank5 = $("#rank5").prop("checked") ? "5" : "";
	var sort = $("input[name='sort']:checked").val();
	var selectedTags = [];
	$("input[data-tag-id]:checked", "#selectTags").each(function (idx, tagCheckbox) {
		selectedTags.push($(tagCheckbox).data("tag"));
	});

	// clear tag count info
	$("input[data-tag-id]", "#selectTags").each(function (index, tagCheckbox) {
		var tag = $(tagCheckbox).data("tag");
		tag.count = 0;
		$(tagCheckbox).next().addClass("nonExist");
	});

	collectedList = [];
	// filtering
	for (var i = 0; i < videoList.length; i++) {
		var flay = videoList[i];

		if (vid && sub) {
			// 비디오와 자막 모두 있는
			if (flay.files.movie.length === 0 || flay.files.subtitles.length === 0) continue;
		} else if (vid && !sub) {
			// 비디오가 있으면
			if (flay.files.movie.length === 0) continue;
		} else if (!vid && sub) {
			// 비디오 없는 자막
			if (flay.files.movie.length > 0 || flay.files.subtitles.length === 0) continue;
		} else {
			// 비디오와 자막 모두 없는
			if (flay.files.movie.length > 0 || flay.files.subtitles.length > 0)
				// 비디오가 있고
				continue;
		}

		var rank = rank0 + rank1 + rank2 + rank3 + rank4 + rank5;
		if (rank.indexOf(flay.video.rank) < 0) {
			continue;
		}

		if (fav) {
			var found = false;
			for (var x in flay.actressList) {
				var actress = getActress(flay.actressList[x]);
				if (actress && actress.favorite) {
					found = true;
					break;
				}
			}
			if (!found) {
				continue;
			}
		}

		if (query != "") {
			var fullname = flay.studio + flay.opus + flay.title + Util.Actress.getNames(flay.actressList) + flay.release + flay.comment;
			if (fullname.toLowerCase().indexOf(query.toLowerCase()) < 0) {
				continue;
			}
		}

		// tag check all. id, name, desc
		if (selectedTags.length > 0) {
			var found = false;

			for (var x in selectedTags) {
				var tag = selectedTags[x];

				found = matchTag(tag, flay);
				if (found) {
					break;
				}
			}

			if (!found) {
				continue;
			}
		}

		// tag count
		for (var x in tagList) {
			var tag = tagList[x];
			if (matchTag(tag, flay)) {
				var dataTag = $("input[data-tag-id='" + tag.id + "']", "#selectTags").data("tag");
				if (dataTag) {
					dataTag.count++;
				}
			}
		}

		collectedList.push(flay);
	}

	// sorting
	collectedList.sort(function (flay1, flay2) {
		switch (sort) {
			case "S":
				let sVal = compareTo(flay1.studio, flay2.studio);
				return sVal === 0 ? compareTo(flay1.opus, flay2.opus) : sVal;
			case "O":
				return compareTo(flay1.opus, flay2.opus);
			case "T":
				return compareTo(flay1.title, flay2.title);
			case "A":
				let aVal = compareTo(flay1.actressList, flay2.actressList);
				return aVal === 0 ? compareTo(flay1.opus, flay2.opus) : aVal;
			case "R":
				let rVal = compareTo(flay1.release, flay2.release);
				return rVal === 0 ? compareTo(flay1.opus, flay2.opus) : rVal;
			case "M":
				return compareTo(flay1.lastModified, flay2.lastModified);
		}
	});

	// display flay count of tag
	$("input[data-tag-id]", "#selectTags").each(function (index, tagCheckbox) {
		var tag = $(tagCheckbox).data("tag");
		$(tagCheckbox)
			.next()
			.toggleClass("nonExist", tag.count == 0)
			.empty()
			.append(tag.name, $("<i>", { class: "badge tag-flay-count" }).html(tag.count));
	});

	// console.log('collectedList.length', collectedList.length);
	if (collectedList.length > 0) {
		navigation.random();
		$(".video-wrapper").show();
		loading.off();
	} else {
		$(".pagination")
			.empty()
			.append($("<li>", { class: "page-item disabled" }).append($("<a>", { class: "page-link", href: "javascript:" }).html("0")));
		loading.on("Not found");
	}

	collecting = false;

	// statistics
	var studioMap = new Map();
	var actressMap = new Map();
	var count = 1;
	for (var i = 0; i < collectedList.length; i++) {
		var flay = collectedList[i];

		// flay.studio
		if (studioMap.has(flay.studio)) {
			count = studioMap.get(flay.studio);
			count++;
		} else {
			count = 1;
		}
		studioMap.set(flay.studio, count);

		// flay.actressList
		for (var j = 0; j < flay.actressList.length; j++) {
			var actressName = flay.actressList[j];
			if (actressMap.has(actressName)) {
				count = actressMap.get(actressName);
				count++;
			} else {
				count = 1;
			}
			actressMap.set(actressName, count);
		}
	}
	// console.log(studioMap, actressMap);
	const minCount = 5;
	$("#statisticsStudio")
		.empty()
		.append(
			$("<label>", { class: "text hover text-info float-left" }).append(
				$("<span>")
					.html("Show All")
					.on("click", function () {
						$("#statisticsStudio .studioTag.hide").toggle();
						$(this).html($("#statisticsStudio .studioTag.hide:visible").length > 0 ? minCount + " over" : "Show All");
					})
			)
		);
	for (var [k, v] of studioMap) {
		$("#statisticsStudio").append(
			$("<label>", { class: "text hover studioTag" + (v < minCount ? " hide" : "") })
				.append(
					$("<span>")
						.css({
							fontSize: 16 + v * 0.25,
						})
						.html(k),
					$("<span>", { class: "badge" }).html(v)
				)
				.data("k", k)
				.on("click", function () {
					$("#search").val($(this).data("k"));
					$("#pageContent").trigger("collect");
				})
		);
	}

	$("#statisticsActress")
		.empty()
		.append(
			$("<label>", { class: "text hover text-info float-left" }).append(
				$("<span>")
					.html("Show All")
					.on("click", function () {
						$("#statisticsActress .actressTag.hide").toggle();
						$(this).html($("#statisticsActress .actressTag.hide:visible").length > 0 ? minCount + " over" : "Show All");
					})
			)
		);
	for (var [k, v] of actressMap) {
		$("#statisticsActress").append(
			$("<label>", { class: "text hover actressTag" + (v < minCount ? " hide" : "") })
				.append(
					$("<span>")
						.css({
							fontSize: 16 + v * 0.25,
						})
						.html(k),
					$("<span>", { class: "badge" }).html(v)
				)
				.data("k", k)
				.on("click", function () {
					$("#search").val($(this).data("k"));
					$("#pageContent").trigger("collect");
				})
		);
	}
}

function notice(msg) {
	$(".notice-bar")
		.empty()
		.append(
			$("<label>", { class: "text sm" })
				.html(msg)
				.fadeOut(5000, function () {
					$(this).remove();
				})
		);
}

var navigation = {
	event: function () {
		$("#pageContent").navEvent(function (signal, e) {
			// console.log(`navEvent target=${e.target.tagName} signal=${signal} type=${e.type} ctrl=${e.ctrlKey} alt=${e.altKey} shift=${e.shiftKey} key=${e.key}`);
			switch (signal) {
				case 1: // wheel: up
				case 37: // key  : left
					navigation.previous(e);
					break;
				case -1: // wheel: down
				case 39: // key  : right
					let mode = $("input[name='autoSlideMode']:checked").val();
					if (mode === "R") {
						navigation.random();
					} else {
						navigation.next(e);
					}
					break;
				case 32: // keyup: space
					navigation.random();
					break;
				case 1002: // mouseup  : middle click
					navigation.random();
					$(".info-video").trigger("click"); // video play
					break;
				case 1001: // mouseup  : left click. auto slide off
					$("#autoSlide").prop("checked", false).trigger("change");
					break;
				case 36: // keyup: home
					navigation.go(0);
					break;
				case 35: // keyup: end
					navigation.go(collectedList.length - 1);
					break;
				case 33: // keyup: pageUp
					navigation.go(currentIndex - 9);
					break;
				case 34: // keyup: pageDown
					navigation.go(currentIndex + 9);
					break;
			}

			if (e.type === "keyup") {
				const currentTime = new Date().getTime();
				if (currentTime - keyLastInputTime > 5000) {
					// 5s over, key reset
					keyInputQueue = "";
				}
				keyLastInputTime = currentTime;

				// navigation.go of input number
				if (signal === 13 && keyInputQueue !== "") {
					// enter
					navigation.go(parseInt(keyInputQueue) - 1);
					keyInputQueue = "";
					notice(keyInputQueue);
				} else if (/^\d+$/.test(e.key)) {
					// key is number
					keyInputQueue += e.key;
					notice(keyInputQueue);
				} else if (signal === 8) {
					// backspace
					keyInputQueue = keyInputQueue.slice(0, -1);
					notice(keyInputQueue);
				}
			}
		});
	},
	on: function () {
		$("#pageContent").navActive(true);
	},
	off: function () {
		$("#pageContent").navActive(false);
	},
	previous: function (e) {
		if (Flaying.isPlay) {
			Flaying.backward(e);
		} else {
			navigation.go(currentIndex - 1);
		}
	},
	next: function (e) {
		if (Flaying.isPlay) {
			Flaying.forward(e);
		} else {
			navigation.go(currentIndex + 1);
		}
	},
	random: function (e) {
		if (!Flaying.isPlay) {
			navigation.go(Random.getInteger(0, collectedList.length - 1));
		}
	},
	go: function (idx) {
		if (idx < 0 || idx > collectedList.length - 1) {
			console.warn(`navigation.go wrong index ${idx}`);
			return;
		}
		var prevIndex = currentIndex;
		currentIndex = idx;
		if (prevIndex === currentIndex) {
			return;
		}
		currentFlay = collectedList[currentIndex];

		showVideo(); // currentIndex - prevIndex
		navigation.paging();
	},
	paging: function () {
		var addPaginationBtn = function (idx) {
			$("<li>", {
				class: "page-item " + (idx === 0 ? "first " : "") + (idx === collectedList.length - 1 ? "last " : "") + (idx === currentIndex ? "active" : ""),
			})
				.append(
					$("<a>", { class: "page-link" })
						.html(idx + 1)
						.on("click", function () {
							navigation.go(idx);
						})
				)
				.appendTo($(".pagination"));
		};

		$(".pagination").empty();
		var start = currentIndex - 4;
		start = start < 0 ? 0 : start;
		var end = currentIndex + 5;
		end = end > collectedList.length ? collectedList.length : end;

		if (start > 0) {
			// first navi
			addPaginationBtn(0);
		}
		for (var i = start; i < end; i++) {
			addPaginationBtn(i);
		}
		if (end < collectedList.length) {
			// last navi
			addPaginationBtn(collectedList.length - 1);
		}
		$("#paginationProgress .progress-bar").css({
			width: Math.round(((currentIndex + 1) / collectedList.length) * 100) + "%",
		});
	},
	slide: {
		on: function () {
			var run = function () {
				var mode = $("input[name='autoSlideMode']:checked").val();
				if (mode === "R") {
					navigation.random();
				} else {
					navigation.next();
				}
			};
			run();
			slideTimer = setInterval(() => {
				run();
			}, 5000);
		},
		off: function () {
			clearInterval(slideTimer);
		},
	},
};

function addVideoEvent() {
	// studio
	$(".info-studio")
		.on("click", function () {
			View.studio(currentFlay.studio);
		})
		.addClass("hover");
	// opus
	$(".info-opus").on("click", function () {
		View.video(currentFlay.opus);
	});
	// title
	$(".info-title").on("click", function () {
		View.flay(currentFlay.opus);
	});
	// video file
	$(".info-video").on("click", function () {
		if (currentFlay.files.movie.length > 0) Rest.Flay.play(currentFlay);
		else Search.torrent(currentFlay);
	});
	// subtitles
	$(".info-subtitles").on("click", function () {
		if (currentFlay.files.subtitles.length > 0) {
			Rest.Flay.subtitles(currentFlay);
		} else {
			Search.subtitles(currentFlay.opus);
		}
	});
	// overview
	$(".info-overview").on("click", function () {
		$(this).hide();
		$(".info-overview-input").show().focus();
	});
	// overview input
	$(".info-overview-input").on("keyup", function (e) {
		e.stopPropagation();
		if (e.keyCode === 13) {
			var $this = $(this);
			currentFlay.video.comment = $(this).val();
			Rest.Video.update(currentFlay.video, function () {
				$this.hide();
				$(".info-overview")
					.html(currentFlay.video.comment != "" ? currentFlay.video.comment : "Overview")
					.toggleClass("nonExist", currentFlay.video.comment === "")
					.show();
			});
		}
	});
	// rank
	$("#ranker, input[name='ranker']").on("change", function () {
		currentFlay.video.rank = $(this).val();
		Rest.Video.update(currentFlay.video);
	});
	// actress name click
	$(".info-wrapper-actress").on("click", ".info-actress", function () {
		var actress = $(this).data("actress");
		actress.name != "Amateur" && View.actress(actress.name);
	});
	// actress favorite click
	$(".info-wrapper-actress").on("click", ".fa", function () {
		var $self = $(this);
		var actress = $(this).data("actress");
		actress.favorite = !actress.favorite;
		Rest.Actress.update(actress, function () {
			if (actress.favorite) {
				$self.switchClass("fa-heart-o", "fa-heart favorite");
			} else {
				$self.switchClass("fa-heart favorite", "fa-heart-o");
			}
			// update actress list
			Rest.Actress.list(function (list) {
				actressList = list;
			});
		});
	});
	// new tag input key event 		e.stopPropagation();
	$("#newTagName, #newTagDesc").on("keyup", function (e) {
		e.stopPropagation();
	});
	// add-basket-btn
	$(".add-basket-btn").on("click", function () {
		flayWebsocket.info('{"mode":"grap", "opus":"' + currentFlay.opus + '"}');
	});
	// control video stream
	$(".cover-wrapper-inner.curr > .cover-box").on("click", Flaying.start);
	$(".cover-wrapper-inner.curr > .cover-box > #btnVideoClose").on("click", Flaying.stop);
}

var Flaying = {
	isPlay: false,
	seekTime: 10,
	start: function (e) {
		e.stopPropagation();
		if (!Flaying.isPlay) {
			let $video = $("video");
			let _video = $video.get(0);
			const videoOpus = $video.data("opus");
			if (videoOpus !== currentFlay.opus) {
				$video
					.attr({
						poster: "/static/cover/" + currentFlay.opus,
						src: "/stream/flay/movie/" + currentFlay.opus + "/0",
					})
					.data("opus", currentFlay.opus);
			}
			$video
				.show()
				.off("wheel")
				.on("wheel", function (e) {
					e.stopPropagation();
					if (e.originalEvent.wheelDelta < 0) {
						Flaying.forward(e);
					} else {
						Flaying.backward(e);
					}
				});
			_video.play();
			$("#btnVideoClose").show();
			Flaying.isPlay = true;
		}
	},
	stop: function (e) {
		e.stopPropagation();
		let $video = $("video");
		let _video = $video.get(0);
		$video.hide().off("wheel");
		_video.pause();
		$("#btnVideoClose").hide();
		Flaying.isPlay = false;
	},
	forward: function (e) {
		let $video = $("video");
		let _video = $video.get(0);
		if (Flaying.isPlay) {
			// if built-in video seek, do nothing
			if (e.type !== "wheel" && e.target.tagName === "VIDEO") {
				return;
			}
			_video.currentTime += Flaying.seekTime;
		}
	},
	backward: function (e) {
		let $video = $("video");
		let _video = $video.get(0);
		if (Flaying.isPlay) {
			// if built-in video seek, do nothing
			if (e.type !== "wheel" && e.target.tagName === "VIDEO") {
				return;
			}
			_video.currentTime -= Flaying.seekTime;
		}
	},
};

function showVideo() {
	function showInfo() {
		// studio
		$(".info-studio").html(currentFlay.studio);
		// opus
		$(".info-opus").html(currentFlay.opus);
		// title
		$(".info-title").html(currentFlay.title);
		// actress & event
		$(".info-wrapper-actress").empty();
		$.each(currentFlay.actressList, function (index, name) {
			if (name === "Amateur") {
				return;
			}
			Rest.Actress.get(name, function (actress) {
				$("<div>")
					.append(
						// favorite
						$("<label>", { class: "text info-favorite" }).append($("<i>", { class: "hover fa fa-heart" + (actress.favorite ? " favorite" : "-o") }).data("actress", actress)),
						// actress
						$("<label>", { class: "text hover info-actress" }).data("actress", actress).html(actress.name),
						$("<label>", { class: "text info-actress-extra" }).html(actress.localName),
						$("<label>", { class: "text info-actress-extra" }).html(actress.birth),
						$("<label>", { class: "text info-actress-extra" }).html(Util.Actress.getAge(actress)),
						$("<label>", { class: "text info-actress-extra" }).html(actress.debut.toBlank()),
						$("<label>", { class: "text info-actress-extra" }).html(actress.body),
						$("<label>", { class: "text info-actress-extra" }).html(actress.height.toBlank())
					)
					.appendTo($(".info-wrapper-actress"));
			});
		});
		// release
		$(".info-release").html(currentFlay.release);
		// modified
		$(".info-modified").html(new Date(currentFlay.lastModified).format("yyyy-MM-dd"));
		// video file
		var movieSize = currentFlay.files.movie.length;
		$(".info-video")
			.html(movieSize === 0 ? "Video" : (movieSize > 1 ? movieSize : "") + "V " + File.formatSize(currentFlay.length))
			.toggleClass("nonExist", movieSize === 0);
		// video play
		$(".info-play")
			.html(currentFlay.video.play + "P")
			.toggle(currentFlay.video.play > 0);
		// subtitles
		$(".info-subtitles")
			.html("Subtitles")
			.toggleClass("nonExist", currentFlay.files.subtitles.length === 0);
		// overview
		$(".info-overview-input").val(currentFlay.video.comment).hide();
		$(".info-overview")
			.html(currentFlay.video.comment == "" ? "Overview" : currentFlay.video.comment)
			.toggleClass("nonExist", currentFlay.video.comment === "")
			.show();
		// rank
		$("#ranker").val(currentFlay.video.rank);
		$("input[name='ranker'][value='" + currentFlay.video.rank + "']").prop("checked", true);
		// tag
		$("input:checked", "#videoTags.tag-list").prop("checked", false);
		$.each(currentFlay.video.tags, function (i, tagId) {
			$("input[data-tag-id='" + tagId + "']", "#videoTags").prop("checked", true);
		});
		navigation.on();
	}

	navigation.off();

	var prevCoverURL = PATH,
		currCoverURL = PATH,
		nextCoverURL = PATH;
	prevCoverURL += 0 < currentIndex ? "/static/cover/" + collectedList[currentIndex - 1].opus : "/static/image/random?_=" + new Date().getTime();
	currCoverURL += "/static/cover/" + currentFlay.opus;
	nextCoverURL += currentIndex < collectedList.length - 1 ? "/static/cover/" + collectedList[currentIndex + 1].opus : "/static/image/random?_=" + new Date().getTime();

	$(".cover-wrapper-inner.prev > .cover-box").css({ backgroundImage: "url(" + prevCoverURL + ")" });
	$(".cover-wrapper-inner.curr > .cover-box").css({ backgroundImage: "url(" + currCoverURL + ")" });
	$(".cover-wrapper-inner.next > .cover-box").css({ backgroundImage: "url(" + nextCoverURL + ")" });

	showInfo();
}

function destory() {
	$(document).off("keyup");
	navigation.slide.off();
}
