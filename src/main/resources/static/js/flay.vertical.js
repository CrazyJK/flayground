/**
 * Video Vertical View Javascript
 */
var videoList = [];
var tagList = [];
var collectedList = [];

var currentFlay = null;
var currentIndex = -1;

var slideTimer;
var keyInput = "";
var keyLastInputTime = new Date().getTime();
var collecting = false;
var PATH = "";

$(document).ready(function() {

	attachEventListener();

	loadData();

});

function loadData() {
	// load tag list
	restCall(PATH + "/info/tag/list", {showLoading: false}, (list) => {
		tagList = list;

		// load video list
		restCall(PATH + '/flay/list', {title: "Load video"}, (list) => {
			videoList = list;

			deploy();
		});
	});

}

$.fn.appendTag = function(tagList, tag) {
	var createTag = tag => {
		return $("<label>", {'class': 'input sm'}).append(
				$("<input>", {type: 'checkbox', 'data-tag-id': tag.id}).data("tag", tag),
				$("<span>", {title: tag.description}).html(tag.name)
		);
	};
	
	return this.each(function() {
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

var deploy = () => {
	
	$(".tag-list").empty().appendTag(tagList);

	$("#pageContent").trigger("collect");

};

function attachEventListener() {
	
	// header tag select event
	$("#selectTags").on("change", "input[data-tag-name]", function() {
		if ($("#tagPopup").prop("checked")) {
			var tagId = $(this).data("tag").id;
			popup(PATH + '/video/tag/' + tagId, 'tag-' + tagId, 800, 600);
			this.checked = !this.checked;
		} else {
			var checkedLength = $("#selectTags").find("input[data-tag-name]:checked").length;
			$("#tagCheck").prop('checked', checkedLength > 0);
			$("#pageContent").trigger("collect");
		}
	});

	// body tag event
	$("#videoTags").on("change", "input[data-tag-name]", function() {
		var $this = $(this);
		var isChecked = $this.prop("checked");
		var toggledTag = $this.data("tag");
		if (isChecked) {
			TagUtils.push(currentFlay.video.tags, toggledTag);
		} else {
			TagUtils.remove(currentFlay.video.tags, toggledTag);
		}
		Update.video(currentFlay.video);
	});

	// new tag save
	$(".btn-tag-save").on("click", function() {
		var newTagName = $("#newTagName").val(), newTagDesc = $("#newTagDesc").val();
		if (newTagName != '') {
			var newTag = {name: newTagName, description: newTagDesc};
			Create.tag(newTag, function() {
				TagUtils.push(currentFlay.video.tags, newTag);
				Update.video(currentFlay.video, function() {
					$("#selectTags > .tag-list").appendTag(null, newTag);
					$("#videoTags").appendTag(null, newTag);
					$("input[data-tag-name='" + newTag.name + "']", "#videoTags").prop("checked", true);
					$("#newTagName, #newTagDesc").val('');
				});
			});
		}
	});

	// uncheck select Tag
	$("#tagCheck").on("change", function() {
		var count = $("input[data-tag-name]:checked", "#selectTags").length;
		if (count > 0) {
			$("input[data-tag-name]:checked", "#selectTags").prop("checked", false);
			$("#pageContent").trigger("collect");
		} else {
			this.checked = false;
		}
	});

	// query
	$("#search").on("keyup", function(e) {
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
	$("#autoSlide").on("change", function() {
		if (this.checked) {
			navigation.slide.on();
		} else {
			navigation.slide.off();
		}
	});
	
	// toggle tags
	$("#tags").on("change", function() {
		$("#selectTags").slideToggle(this.checked);
	});
	
	// collect
	$("#pageContent").on("collect", function() {
		!collecting && collectList();
	});

	// data reload
	$(".btn-reload").on("click", function() {
		loadData();
	});
	
	// toggle option
	$(".toggle-option").on("click", function(e) {
		var width = $("#options").width();
		$("#options").css({left: e.target.offsetLeft - width}).slideToggle(150);
	});

	// window resize
	$(window).on("resize", function() {
		var windowWidth  = $(window).width();
		var windowHeight = $(window).height();
		var navHeight = $("nav.navbar").outerHeight();
		var coverWrapperWidth  = $(".cover-wrapper").width();
		var currCoverBoxWidth  = $(".cover-wrapper-inner.curr > .cover-box").width();
		var currCoverBoxHeight = $(".cover-wrapper-inner.curr > .cover-box").height();
		
		$("#pageContent").css({
			height: windowHeight - navHeight
		});
		$("#pageContent, #selectTags, #options").css({
			marginTop: navHeight + 8
		});
		
		var calcX = (windowWidth - coverWrapperWidth) / 2;
		if (calcX < 0) {
			$(".cover-wrapper").css({
				transform: 'translate(' + calcX + 'px, 0)'
			});
		}
		
		var calcWidth = (windowWidth - currCoverBoxWidth - 20) / 2;
		var calcHeight = calcWidth * COVER_RATIO;
		var $sideCover = $(".cover-wrapper-inner.prev > .cover-box, .cover-wrapper-inner.next > .cover-box");
		if (currCoverBoxWidth / 2 > calcWidth) { // too small, hide
			$sideCover.hide();
		} else if (currCoverBoxWidth < calcWidth) { // too large, set default
			$sideCover.css({
				width: currCoverBoxWidth,
				height: currCoverBoxHeight
			}).show();
		} else {
			$sideCover.css({
				width: calcWidth,
				height: calcHeight
			}).show();
		}

	}).trigger("resize");
}

function collectList() {
	var compareTo = function(data1, data2) {
		var result = 0;
		if (typeof data1 === 'number') {
			result = data1 - data2;
		} else if (typeof data1 === 'string') {
			result = data1.toLowerCase().localeCompare(data2.toLowerCase());
		} else if (typeof data1 === 'object') { // maybe actressList
			result = ActressUtils.getNames(data1).localeCompare(ActressUtils.getNames(data2));
		} else {
			result = data1 > data2 ? 1 : -1;
		}
		return result;
	};
	
	collecting = true;
	loading.on('Collect list');
	$(".video-wrapper").hide();
	
	var query = $("#search").val();
	var fav   = $("#favorite" ).prop("checked");
	var vid   = $("#video"    ).prop("checked");
	var sub   = $("#subtitles").prop("checked");
	var rank0 = $("#rank0").prop("checked") ? '0' : '';
	var rank1 = $("#rank1").prop("checked") ? '1' : '';
	var rank2 = $("#rank2").prop("checked") ? '2' : '';
	var rank3 = $("#rank3").prop("checked") ? '3' : '';
	var rank4 = $("#rank4").prop("checked") ? '4' : '';
	var rank5 = $("#rank5").prop("checked") ? '5' : '';
	var sort  = $("input[name='sort']:checked").val();
	var selectedTags  = [];
	$("input[data-tag-name]:checked", "#selectTags").each(function(idx, tagCheckbox) {
		selectedTags.push($(tagCheckbox).data("tag").name);
	});
	
	collectedList = [];
	// filtering
	for (var i=0; i<videoList.length; i++) {
		var flay = videoList[i];

		if (vid && sub) { // 비디오와 자막 모두 있는
			if (flay.movieFileList.length === 0 || flay.subtitlesFileList.length === 0) 
				continue;
		} else if (vid && !sub) { // 비디오가 있으면
			if (flay.movieFileList.length === 0)
				continue;
		} else if (!vid && sub) { // 비디오 없는 자막
			if (flay.movieFileList.length > 0 || flay.subtitlesFileList.length === 0)
				continue;
		} else { // 비디오와 자막 모두 없는
			if (flay.movieFileList.length > 0 || flay.subtitlesFileList.length > 0) // 비디오가 있고
				continue;
		}
		
		var rank = rank0 + rank1 + rank2 + rank3 + rank4 + rank5;
		if (rank.indexOf(flay.video.rank) < 0) {
			continue;
		} 
		
		if (fav) {
			var found = false;
			$.each(flay.actressList, function(idx, actress) {
				if (actress.favorite) {
					found = true;
				}
			});
			if (!found) {
				continue;
			}
		}

		if (query != '') {
			var fullname = flay.studio + flay.opus + flay.title + ActressUtils.getNames(flay.actressList) + flay.release + flay.comment;
			if (fullname.indexOf(query) < 0) {
				continue;
			}
		}
		
		if (selectedTags.length > 0) {
			var found = false;
			for (var x in flay.video.tags) {
				if (selectedTags.includes(flay.video.tags[x].name)) {
					found = found || true;
				}
			}
			if (!found) {
				continue;
			}
		}
		
		collectedList.push(flay);
	}
	
	// sorting
	collectedList.sort(function(flay1, flay2) {
		switch(sort) {
		case 'S':
			return compareTo(flay1.studio, flay2.studio);
		case 'O':
			return compareTo(flay1.opus, flay2.opus);
		case 'T':
			return compareTo(flay1.title, flay2.title);
		case 'A':
			return compareTo(flay1.actressList, flay2.actressList);
		case 'R':
			return compareTo(flay1.release, flay2.release);
		case 'M':
			return compareTo(flay1.lastModified, flay2.lastModified);
		}
	});

	// fill tag count info
	$("input[data-tag-name]", "#selectTags").each(function(index, tagCheckbox) {
		var tag = $(tagCheckbox).data("tag");
		tag.count = 0;
		$(tagCheckbox).next().addClass("nonExist");
	});

	console.log('collectedList.length', collectedList.length);
	if (collectedList.length > 0) {
		
		for (var x in collectedList) {
			var flay = collectedList[x];
			for (var y in flay.video.tags) {
				var videoTag = flay.video.tags[y];
				var tag = $("input[data-tag-id='" + videoTag.id + "']", "#selectTags").data("tag");
				if (tag) {
					tag.count++;
				} else {
					console.log('flay.video.tags before', flay.video.tags, videoTag.id);
					var deleted = flay.video.tags.splice(y, 1);
					console.log('flay.video.tags  after', flay.video.tags, deleted);
					Video.update(flay.video);
//					throw "Notfound tag.id " + videoTag.id + " in [" + flay.video.opus + "]";
				}
			}
		}
		$("input[data-tag-name]", "#selectTags").each(function(index, tagCheckbox) {
			var tag = $(tagCheckbox).data("tag");
			if (tag.count > 0) {
				$(tagCheckbox).next().removeClass("nonExist").html(tag.name + " " + tag.count);
			} else {
				$(tagCheckbox).next().html(tag.name);
			}
		});
		
		navigation.random();
		$(".video-wrapper").show();
		loading.off();
	} else {
		$(".pagination").empty().append(
				$("<li>", {'class': 'page-item disabled'}).append(
						$("<a>", {'class': 'page-link', 'href': 'javascript:'}).html("0")
				)
		);
		loading.on("Not found");
	}
	collecting = false;
}

function notice(msg) {
	$(".notice-bar").empty().append(
			$("<label>", {class: 'text sm'}).html(msg).fadeOut(5000, function() {
				$(this).remove();
			})
	);
}

var navigation = {
		event: function() {
			$("#pageContent").navEvent(function(signal, e) {
				switch(signal) {
				case 1: // mousewheel: up
				case 37: // key : left
					navigation.previous();
					break;
				case -1: // mousewheel: down
				case 39: // key : right
					navigation.next();
					break;
				case 32: // key: space
					navigation.random();
					break;
				case 1002: // mousedown  : middle click
					navigation.random();
					$(".info-video").trigger("click"); // video play
					break;
				case 1001: // mousedown  : left click. auto slide off
					$("#autoSlide").prop("checked", false).trigger("change");
					break;
				case 36: // key: home
					navigation.go(0);
					break;
				case 35: // key: end
					navigation.go(collectedList.length -1);
					break;
				case 33: // key: pageUp
					navigation.go(currentIndex - 9);
					break;
				case 34: // key: pageDown 	
					navigation.go(currentIndex + 9);
					break;
				}
				var currentTime = new Date().getTime();
				if (currentTime - keyLastInputTime > 5000) { // 5s over, key reset
					keyInput = "";
				}
				keyLastInputTime = currentTime;
				// navigation.go of input number
				if (signal === 13 && keyInput != '') { // enter
					var idx = parseInt(keyInput) - 1;
					keyInput = "";
					notice('');
					navigation.go(idx);
				} else if (/^\d+$/.test(e.key)) { // key is number
					keyInput += e.key;
					notice(keyInput);
				} else if (signal === 8) { // backspace
					keyInput = keyInput.slice(0, -1);
					notice(keyInput);
				}
			});
		},
		on: function() {
			$("#pageContent").navActive(true);
		},
		off: function() {
			$("#pageContent").navActive(false);
		},
		previous: function() {
			navigation.go(currentIndex - 1);
		},
		next: function () {
			navigation.go(currentIndex + 1);
		},
		random: function() {
			navigation.go(random.getInteger(0, collectedList.length-1));
		},
		go: function(idx) {
			if (idx < 0 || idx > collectedList.length - 1) {
				console.log('navigation.go wrong index', idx);
				return;
			}
			var prevIndex = currentIndex;
			currentIndex = idx;
			if (prevIndex === currentIndex) {
				return;
			}
			currentFlay = collectedList[currentIndex];
			
			// direction = 1: next, -1: previous, over: random
			showVideo(currentIndex - prevIndex);
			navigation.paging();
		},
		paging: function() {
			var addPaginationBtn = function(idx) {
				$("<li>", {
					'class': 'page-item ' + (idx === 0 ? 'first ' : '') + (idx === collectedList.length - 1 ? 'last ' : '') + (idx === currentIndex ? 'active' : '')
				}).append(
						$("<a>", {class: 'page-link'}).html(idx+1).on("click", function() {
							navigation.go(idx);
						})
				).appendTo($(".pagination"));
			};
			
			$(".pagination").empty();
			var start = currentIndex - 4;
			start = start < 0 ? 0 : start;
			var end = currentIndex + 5;
			end = end > collectedList.length ? collectedList.length : end;
			
			if (start > 0) { // first navi
				addPaginationBtn(0);
			}
			for (var i = start; i < end; i++) {
				addPaginationBtn(i);
			}
			if (end < collectedList.length) { // last navi
				addPaginationBtn(collectedList.length - 1);
			}
		},
		slide: {
			on: function() {
				var run = function() {
					var mode  = $("input[name='autoSlideMode']:checked").val();
					if (mode === 'R') {
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
			off: function() {
				clearInterval(slideTimer);
			}
		}
};

function addVideoEvent() {
	// opus
	$(".info-opus").on("click", function() {
		View.video(currentFlay.opus);
	});
	// title
	$(".info-title").on("click", function() {
		View.flay(currentFlay.opus);
	});
	// video file
	$(".info-video").on("click", function() {
		if (currentFlay.movieFileList.length > 0) 
			Flay.play(currentFlay);
		else
			Search.torrent(currentFlay);
	});
	// subtitles
	$(".info-subtitles").on("click", function() {
		if (currentFlay.subtitlesFileList.length > 0)
			Flay.subtitles(currentFlay);
	});
	// overview
	$(".info-overview").on("click", function() {
		$(this).hide();
		$(".info-overview-input").show().focus();
	});
	// overview input
	$(".info-overview-input").on("keyup", function(e) {
		e.stopPropagation();
		if (e.keyCode === 13) {
			var $this = $(this);
			currentFlay.video.comment = $(this).val();
			Update.video(currentFlay.video, function() {
				$this.hide();
				$(".info-overview").html(currentFlay.video.comment != '' ? currentFlay.video.comment : 'Overview').show();
			});
		}
	});
	// rank
	$("#ranker, input[name='ranker']").on("change", function() {
		currentFlay.video.rank = $(this).val();
		console.log('currentFlay.video', currentFlay.video);
		Update.video(currentFlay.video, function() {
			decorateRank(currentFlay.video.rank);
		});
	});
	// actress name click
	$(".info-wrapper-actress").on("click", ".info-actress", function() {
		var actress = $(this).data("actress");
		actress.name != 'Amateur' && View.actress(actress.name);
	});
	// actress favorite click
	$(".info-wrapper-actress").on("click", ".fa", function() {
		var $self = $(this);
		var actress = $(this).data("actress");
		actress.favorite = !actress.favorite
		Update.actress(actress, function() {
			if (actress.favorite) {
				$self.switchClass('fa-star-o', 'fa-star favorite');
			} else {
				$self.switchClass('fa-star favorite', 'fa-star-o');
			}
		});
	});
	// new tag input key event 		e.stopPropagation();
	$("#newTagName, #newTagDesc").on("keyup", function(e) {
		e.stopPropagation();
	});
}

function showVideo(direction) {
	function showInfo() {
		// studio
		$(".info-studio").html(currentFlay.studio);
		// opus
		$(".info-opus").html(currentFlay.opus);
		// title
		$(".info-title").html(currentFlay.title);
		// actress & event
		var actressArray = [];
		$.each(currentFlay.actressList, function(index, actress) {
			actressArray.push(
					$("<div>").append(
							// favorite
							actress.name != 'Amateur' &&
							$("<label>", {'class': 'text info-favorite'}).append(
									$("<i>", {'class': "hover fa fa-star" + (actress.favorite ? " favorite" : "-o")}).data("actress", actress)
							),
							// actress
							$("<label>", {'class': 'text hover info-actress'}).data("actress", actress).html(actress.name),
							$("<label>", {'class': 'text info-actress-extra'}).html(actress.localName),
							$("<label>", {'class': 'text info-actress-extra'}).html(actress.birth),
							$("<label>", {'class': 'text info-actress-extra'}).html(ageCalculateAge(actress.birth)),
							$("<label>", {'class': 'text info-actress-extra'}).html(zeroToEmpty(actress.debut)),
							$("<label>", {'class': 'text info-actress-extra'}).html(actress.bodySize),
							$("<label>", {'class': 'text info-actress-extra'}).html(zeroToEmpty(actress.height)),
							$("<label>", {'class': 'text info-actress-extra'}).html('v' + actress.videoCount)
					)
			);
		});
		$(".info-wrapper-actress").empty().append(actressArray);
		// release
		$(".info-release").html(currentFlay.release);
		// modified
		$(".info-modified").html(new Date(currentFlay.lastModified).format("yyyy-MM-dd"));
		// video file
		var movieSize = currentFlay.movieFileList.length;
		$(".info-video").html(
				movieSize === 0 ? 'Video' : 
					movieSize === 1 ? 'V ' + formatFilesize(currentFlay.length) :
						movieSize + 'V ' + formatFilesize(currentFlay.length)
		).toggleClass("nonExist", movieSize === 0);
		// subtitles
		$(".info-subtitles").html("Subtitles")
				.toggleClass("nonExist", currentFlay.subtitlesFileList.length === 0);
		// overview
		$(".info-overview-input").val(currentFlay.video.comment).hide();
		$(".info-overview").html(currentFlay.video.comment == '' ? 'Overview' : currentFlay.video.comment)
				.toggleClass("nonExist", currentFlay.video.comment === '').show();
		// rank
		$("#ranker").val(currentFlay.video.rank);
		$("input[name='ranker'][value='" + currentFlay.video.rank + "']").prop("checked", true);
		// rank decorate
		decorateRank(currentFlay.video.rank);
		// tag
		$("input:checked", "#videoTags.tag-list").prop('checked', false);
		$.each(currentFlay.video.tags, function(i, tag) {
			$("input[data-tag-id='" + tag.id + "']", "#videoTags").prop('checked', true);
		});
		navigation.on();
	}
	
	navigation.off();

	var prevCoverURL = PATH, currCoverURL = PATH, nextCoverURL = PATH;
	prevCoverURL += (0 < currentIndex) ? "/static/cover/" + collectedList[currentIndex-1].opus : '/static/image/random?_=' + new Date().getTime();
	currCoverURL += "/static/cover/" + currentFlay.opus;
	nextCoverURL += (currentIndex < collectedList.length-1) ? "/static/cover/" + collectedList[currentIndex+1].opus : '/static/image/random?_=' + new Date().getTime();

	var image1 = new Image();
	image1.onload = function() {
		$(".cover-wrapper-inner.prev > .cover-box").css({backgroundImage: 'url(' + prevCoverURL + ')'});
	};
	image1.src = prevCoverURL;
	
	var image2 = new Image();
	image2.onload = function() {
		$(".cover-wrapper-inner.curr > .cover-box").css({backgroundImage: 'url(' + currCoverURL + ')'});
	};
	image2.src = currCoverURL;
	
	var image3 = new Image();
	image3.onload = function() {
		$(".cover-wrapper-inner.next > .cover-box").css({backgroundImage: 'url(' + nextCoverURL + ')'});
	};
	image3.src = nextCoverURL;

	showInfo();
}

function decorateRank(rank) {
	var color = '';
	if (rank < 0) {
		color = 'rgba(0, 0, 255, 0.5)';
	} else if (rank == 0) {
		color = 'rgba(255, 255, 255, 0.5)';
	} else {
		color = 'rgba(255, 0, 0, ' + rank*1.5/10 + ')';
	}
	$(".label-range").css({backgroundColor: color});
	$(".ranker-mark").html(rank);
}

var todayYear = new Date().getFullYear();
function ageCalculateAge(birth) {
	if (birth.length > 3) {
		return todayYear - parseInt(birth.substring(0, 4)) + 1;
	} else {
		return '';
	}
}

function zeroToEmpty(number) {
	return number === 0 ? "" : number;
}

