/**
 * Video Vertical View Javascript
 */
'use strict';

(() => {
	let tagList = [];
	let flayList = [];
	let actressList = [];
	let collectedList = [];
	let seenList = [];

	let currentFlay = null;
	let currentIndex = -1;

	let slideTimer;
	let keyInputQueue = '';
	let keyLastInputTime = Date.now();

	const createTag = (tag) => {
		return $('<label>', { class: 'check sm' }).append($('<input>', { type: 'checkbox', 'data-tag-id': tag.id }).data('tag', tag), $('<span>', { title: tag.description }).html(tag.name));
	};

	$.fn.appendTag = function (tagList, tag) {
		return this.each(function () {
			const $this = $(this);
			if (tagList) {
				tagList.forEach((tag) => {
					$this.append(createTag(tag));
				});
			}
			if (tag) {
				$this.append(createTag(tag));
			}
		});
	};

	const Flaying = {
		isPlay: false,
		seekTime: 10,
		start: function (e) {
			e.stopPropagation();
			if (!Flaying.isPlay) {
				let $video = $('video');
				let _video = $video.get(0);
				const videoOpus = $video.data('opus');
				if (videoOpus !== currentFlay.opus) {
					$video
						.attr({
							poster: '/static/cover/' + currentFlay.opus,
							src: '/stream/flay/movie/' + currentFlay.opus + '/0',
						})
						.data('opus', currentFlay.opus);
				}
				$video
					.show()
					.off('wheel')
					.on('wheel', function (e) {
						e.stopPropagation();
						if (e.originalEvent.wheelDelta < 0) {
							Flaying.forward(e);
						} else {
							Flaying.backward(e);
						}
					});
				_video.play();
				$('#btnVideoClose').show();
				Flaying.isPlay = true;
			}
		},
		stop: function (e) {
			e.stopPropagation();
			let $video = $('video');
			let _video = $video.get(0);
			$video.hide().off('wheel');
			_video.pause();
			$('#btnVideoClose').hide();
			Flaying.isPlay = false;
		},
		forward: function (e) {
			let $video = $('video');
			let _video = $video.get(0);
			if (Flaying.isPlay) {
				// if built-in video seek, do nothing
				if (e.type !== 'wheel' && e.target.tagName === 'VIDEO') {
					return;
				}
				_video.currentTime += Flaying.seekTime;
			}
		},
		backward: function (e) {
			let $video = $('video');
			let _video = $video.get(0);
			if (Flaying.isPlay) {
				// if built-in video seek, do nothing
				if (e.type !== 'wheel' && e.target.tagName === 'VIDEO') {
					return;
				}
				_video.currentTime -= Flaying.seekTime;
			}
		},
	};

	const navigation = {
		event: function () {
			$('#pageContent').navEvent(function (signal, e) {
				console.debug(`navEvent target=${e.target.tagName} signal=${signal} type=${e.type} ctrl=${e.ctrlKey} alt=${e.altKey} shift=${e.shiftKey} key=${e.key}`);
				switch (signal) {
					case 1: // wheel: up
					case 37: // key  : left
						navigation.previous(e);
						break;
					case -1: // wheel: down
					case 39: // key  : right
						let mode = $("input[name='autoSlideMode']:checked").val();
						if (mode === 'R') {
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
						$('.info-video').trigger('click'); // video play
						break;
					case 1001: // mouseup  : left click. auto slide off
						$('#autoSlide').prop('checked', false).trigger('change');
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

				if (e.type === 'keyup') {
					const currentTime = new Date().getTime();
					if (currentTime - keyLastInputTime > 5000) {
						// 5s over, key reset
						keyInputQueue = '';
					}
					keyLastInputTime = currentTime;

					// navigation.go of input number
					if (signal === 13 && keyInputQueue !== '') {
						// enter
						navigation.go(parseInt(keyInputQueue) - 1);
						keyInputQueue = '';
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
			$('#pageContent').navActive(true);
		},
		off: function () {
			$('#pageContent').navActive(false);
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
				let randomIndex = -1;
				do {
					randomIndex = Random.getInteger(0, collectedList.length - 1);
					console.debug(`random ${randomIndex} seen ${seenList.length} collect ${collectedList.length}`);
					if (!seenList.includes(randomIndex)) {
						break;
					}
				} while (seenList.length < collectedList.length);

				navigation.go(randomIndex);
			}
		},
		go: function (idx) {
			if (idx < 0 || idx > collectedList.length - 1) {
				console.error(`navigation.go wrong index ${idx}`);
				return;
			}
			var prevIndex = currentIndex;
			currentIndex = idx;
			if (prevIndex === currentIndex) {
				return;
			}
			currentFlay = collectedList[currentIndex];

			if (!seenList.includes(currentIndex)) {
				seenList.push(currentIndex);
				console.debug('showingHistory', seenList);
			}
			if (seenList.length === collectedList.length) {
				seenList = [];
				notice(`<span class="text-danger">Saw every flay</span>`);
			}

			showVideo();
			navigation.paging();
		},
		paging: function () {
			var addPaginationBtn = (idx) => {
				$('<li>', { class: 'page-item' + (idx === currentIndex ? ' active' : '') })
					.append(
						$('<a>', { class: 'page-link' })
							.on('click', function () {
								navigation.go(idx);
							})
							.html(idx + 1),
					)
					.appendTo($('.pagination'));
			};

			$('.pagination').empty();
			const pageLength = 12;
			var start = Math.max(currentIndex - (pageLength / 2 - 1), 0);
			var end = Math.min(currentIndex + pageLength / 2, collectedList.length);

			if (start > 0) {
				addPaginationBtn(0); // first page
			}
			for (var i = start; i < end; i++) {
				addPaginationBtn(i);
			}
			if (end < collectedList.length) {
				addPaginationBtn(collectedList.length - 1); // last page
			}

			$('#paginationProgress .progress-bar').css({
				width: Math.round(((currentIndex + 1) / collectedList.length) * 100) + '%',
			});
		},
		slide: {
			on: function () {
				var run = function () {
					var mode = $("input[name='autoSlideMode']:checked").val();
					if (mode === 'R') {
						navigation.random();
					} else {
						if (currentIndex + 1 === collectedList.length) {
							currentIndex = -1;
						}
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

	function attachEventListener() {
		function addVideoEvent() {
			// studio
			$('.info-studio')
				.on('click', function () {
					View.studio(currentFlay.studio);
				})
				.addClass('hover');
			// opus
			$('.info-opus').on('click', function () {
				View.video(currentFlay.opus);
			});
			// title
			$('.info-title').on('click', function () {
				View.flay(currentFlay.opus);
			});
			// video file
			$('.info-video').on('click', function () {
				if (currentFlay.files.movie.length > 0) {
					Rest.Flay.play(currentFlay, function () {
						let playCount = parseInt($('#playCount').text());
						$('#playCount').html(++playCount);
					});
				} else {
					Search.torrent(currentFlay);
				}
			});
			$('.info-play').on('click', () => {
				Rest.History.find(currentFlay.opus, (histories) => {
					let total = histories.length;
					let height = total * 29 + 68 + 16;
					let html = `<!DOCTYPE html>
					<html>
						<head>
							<title>${currentFlay.opus} - history</title>
							<style>
							body {margin: 0; background-color: #000; color: #fff;}
							main {display: flex;flex-wrap: wrap;}
							iframe {width: 100%; height: 300px; border: 0;}
							.history-item {display: flex; margin: 8px; width: 300px; gap: 8px;}
							.history-item > label:nth-child(1) {flex: 1 1 40px; text-align: right;}
							.history-item > label:nth-child(2) {flex: 1 1 100px;}
							.history-item > label:nth-child(3) {flex: 2 1 200px;}
							</style>
						</head>
						<body>
							<aside>
								<iframe src="/html/info/info.history.html?opus=${currentFlay.opus}"></iframe>
							</aside>
							<main>`;
					histories.forEach((history, index) => {
						html += `<div class="history-item">
									<label>${total--}</label>
									<label>${history.action}</label>
									<label>${history.date}</label>
								</div>`;
					});
					html += `
							</main>
							<script>
							document.addEventListener("DOMContentLoaded", function() {
								setTimeout(() => {
									window.resizeTo(400, document.body.querySelector("body > main").scrollHeight + 68 + 16 + 300);
								}, 500);
							});
							</script>
						</body>
					</html>
					`;
					console.debug('history', histories, html);
					const historyPopup = window.open('', 'historyPopup', 'width=400,height=' + height + ',' + DEFAULT_SPECS);
					historyPopup.document.open();
					historyPopup.document.write(html);
					// historyPopup.document.title = currentFlay.opus;
					historyPopup.document.close();
				});
			});
			// subtitles
			$('.info-subtitles').on('click', function () {
				if (currentFlay.files.subtitles.length > 0) {
					Rest.Flay.subtitles(currentFlay);
				} else {
					Search.subtitles(currentFlay.opus);
				}
			});
			// overview
			$('.info-overview').on('click', function () {
				$(this).hide();
				$('.info-overview-input').show().focus();
			});
			// overview input
			$('.info-overview-input').on('keyup', function (e) {
				e.stopPropagation();
				if (e.keyCode === 13) {
					var $this = $(this);
					currentFlay.video.comment = $(this).val();
					Rest.Video.update(currentFlay.video, function () {
						$this.hide();
						$('.info-overview')
							.html(currentFlay.video.comment != '' ? currentFlay.video.comment : 'Overview')
							.toggleClass('nonExist', currentFlay.video.comment === '')
							.show();
					});
				}
			});
			// rank
			$("#ranker, input[name='ranker']").on('change', function () {
				currentFlay.video.rank = $(this).val();
				Rest.Video.update(currentFlay.video);
			});
			// actress name click
			$('.info-wrapper-actress').on('click', '.info-actress-name', function () {
				var actress = $(this).closest('.info-actress').data('actress');
				actress.name != 'Amateur' && View.actress(actress.name);
			});
			// actress favorite click
			$('.info-wrapper-actress').on('click', '.info-actress-favorite i.fa', function () {
				var actress = $(this).closest('.info-actress').data('actress');
				var $self = $(this);
				actress.favorite = !actress.favorite;
				Rest.Actress.update(actress, function () {
					if (actress.favorite) {
						$self.switchClass('fa-heart-o', 'fa-heart favorite');
					} else {
						$self.switchClass('fa-heart favorite', 'fa-heart-o');
					}
					// update actress list
					Rest.Actress.list(function (list) {
						actressList = list;
					});
				});
			});
			// new tag input key event 		e.stopPropagation();
			$('#newTagName, #newTagDesc').on('keyup', function (e) {
				e.stopPropagation();
			});
			// add-basket-btn
			$('.add-basket-btn').on('click', function () {
				flayWebsocket.info('{"mode":"grap", "opus":"' + currentFlay.opus + '"}');
			});
			// control video stream
			$('.cover-wrapper-inner.curr > .cover-box').on('click', Flaying.start);
			$('.cover-wrapper-inner.curr > .cover-box > #btnVideoClose').on('click', Flaying.stop);
			// rename flay
			$('.file-wrapper .file-wrapper-rename input').on('keyup', (e) => {
				e.stopPropagation();
			});
			$('#rename-btn').on('click', () => {
				const newStudio = $('#rename-studio').val();
				const newOpus = $('#rename-opus').val();
				const newTitle = $('#rename-title').val();
				const newActress = $('#rename-actress').val();
				const newRelease = $('#rename-release').val();
				const newFlay = {
					studio: newStudio,
					opus: newOpus,
					title: newTitle,
					actressList: Util.Actress.toArray(newActress),
					release: newRelease,
				};
				Rest.Flay.rename(currentFlay.opus, newFlay, reloadCurrentFlay);
			});
		}

		// header tag select event
		$('#selectTags').on('change', 'input[data-tag-id]', function () {
			if ($('#tagPopup').prop('checked')) {
				var tagId = $(this).data('tag').id;
				View.tag(tagId);
				this.checked = !this.checked;
			} else {
				var checkedLength = $('#selectTags').find('input[data-tag-id]:checked').length;
				$('#tagCheck').prop('checked', checkedLength > 0);
				$('#pageContent').trigger('collect');
			}
		});

		// body tag event
		$('#videoTags').on('change', 'input[data-tag-id]', function () {
			var $this = $(this);
			var isChecked = $this.prop('checked');
			var toggledTag = $this.data('tag');
			if (isChecked) {
				Util.Tag.push(currentFlay.video.tags, toggledTag);
			} else {
				Util.Tag.remove(currentFlay.video.tags, toggledTag);
			}
			Rest.Video.update(currentFlay.video);
		});

		// new tag save
		$('.btn-tag-save').on('click', function () {
			var newTagName = $('#newTagName').val(),
				newTagDesc = $('#newTagDesc').val();
			if (newTagName != '') {
				var newTag = { name: newTagName, description: newTagDesc };
				Rest.Tag.create(newTag, function (createdTag) {
					Util.Tag.push(currentFlay.video.tags, createdTag);
					Rest.Video.update(currentFlay.video, function () {
						$('#selectTags > .tag-list').appendTag(null, createdTag);
						$('#videoTags').appendTag(null, createdTag);
						$("input[data-tag-id='" + createdTag.id + "']", '#videoTags').prop('checked', true);
						$('#newTagName, #newTagDesc').val('');
					});
				});
			}
		});

		// uncheck select Tag
		$('#tagCheck').on('change', function () {
			var count = $('input[data-tag-id]:checked', '#selectTags').length;
			if (count > 0) {
				$('input[data-tag-id]:checked', '#selectTags').prop('checked', false);
				$('#pageContent').trigger('collect');
			} else {
				this.checked = false;
			}
		});

		// query
		$('#search').on('keyup', function (e) {
			e.stopPropagation();
			if (e.keyCode == 13) {
				$('#pageContent').trigger('collect');
			}
		});

		// collect
		$('#pageContent').on('collect', collectList);

		// filter, rank & sort condition change
		$("#favorite, #noFavorite, #video, #subtitles, #rank0, #rank1, #rank2, #rank3, #rank4, #rank5, input[name='sort']").on('change', collectList);

		// video label event
		addVideoEvent();

		// navigation event
		navigation.event();

		// auto slide
		$('#autoSlide').on('change', function () {
			if (this.checked) {
				navigation.slide.on();
			} else {
				navigation.slide.off();
			}
		});

		// source
		$("input[name='source']").on('change', loadData);

		// toggle tags
		$('#tags').on('change', function () {
			$('#selectTags').slideToggle(this.checked);
		});
		// statistics studio
		$('#toggleStatisticsStudio').on('change', function () {
			$('#statisticsStudio').slideToggle(this.checked);
		});
		// statistics actress
		$('#toggleStatisticsActress').on('change', function () {
			$('#statisticsActress').slideToggle(this.checked);
		});

		// data reload
		$('.btn-reload').on('click', function () {
			loadData();
		});

		// toggle option
		$('.toggle-option').on('click', function (e) {
			$('#options')
				.css({ left: e.clientX - $('#options').width() })
				.slideToggle(150);
		});

		// paginationProgress
		$('#paginationProgress').on('click', (e) => {
			navigation.go(parseInt(collectedList.length * (e.clientX / $('#paginationProgress').width())));
		});

		// window resize
		$(window).on('resize', function () {
			var coverWrapperWidth = $('.cover-wrapper').width();
			// var windowHeight = $(window).height();
			// var navHeight = $("nav.navbar").outerHeight();
			const $currCoverBox = $('.cover-wrapper-inner.curr > .cover-box');
			const currCoverBoxWidth = $currCoverBox.width();
			const currCoverBoxHeight = $currCoverBox.height();
			const calcWidth = (coverWrapperWidth - currCoverBoxWidth - 20) / 2;
			const calcHeight = calcWidth * COVER_RATIO;
			const $sideCover = $('.cover-wrapper-inner.prev > .cover-box, .cover-wrapper-inner.next > .cover-box');
			console.debug(`window resize currCoverBoxWidth: ${currCoverBoxWidth} calcWidth: ${calcWidth} currCoverBox.bg: ${$currCoverBox.css('background-image')}`);

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
		});
	}

	function loadData() {
		Promise.all([
			new Promise((resolve, reject) => {
				Rest.Tag.list(resolve);
			}),
			new Promise((resolve, reject) => {
				const source = $("input[name='source']:checked").val();
				if (source === 'All') {
					Rest.Flay.list(resolve);
				} else if (source === 'Low') {
					Rest.Flay.listOfLowScore(resolve);
				}
			}),
			new Promise((resolve, reject) => {
				Rest.Actress.list(resolve);
			}),
		]).then(([tagValue, flayValue, actressValue]) => {
			tagList = tagValue;
			flayList = flayValue;
			actressList = actressValue;

			$('.tag-list > label:not(.label-add-tag)').remove();
			$('.tag-list').prepend(tagList.sort((t1, t2) => t1.name.localeCompare(t2.name)).map((tag) => createTag(tag)));

			$('#pageContent').trigger('collect');

			$(window).trigger('resize');
		});

		SessionStorageItem.clear();

		/*
		let tagLoaded = false;
		let flayLoaded = false;
		let actressLoaded = false;
		const deploy = () => {
			if (tagLoaded && flayLoaded && actressLoaded) {
				let tagArray = [];
				tagList.forEach((tag) => {
					tagArray.push(createTag(tag));
				});
				$(".tag-list > label:not(.label-add-tag)").remove();
				$(".tag-list").prepend(tagArray);
				$("#pageContent").trigger("collect");
				$(window).trigger("resize");
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
		const source = $("input[name='source']:checked").val();
		if (source === "All") {
			Rest.Flay.list(function (list) {
				flayList = list;
				flayLoaded = true;
				deploy();
			});
		} else if (source === "Low") {
			Rest.Flay.listOfLowScore(function (list) {
				flayList = list;
				flayLoaded = true;
				deploy();
			});
		}
		// load actress list
		Rest.Actress.list(function (list) {
			actressList = list;
			actressLoaded = true;
			deploy();
		});
		*/
	}

	function collectList() {
		const compareTo = (data1, data2) => {
			var result = 0;
			if (typeof data1 === 'number') {
				result = data1 - data2;
			} else if (typeof data1 === 'string') {
				result = data1.toLowerCase().localeCompare(data2.toLowerCase());
			} else if (typeof data1 === 'object') {
				// maybe actressList
				result = Util.Actress.getNames(data1).localeCompare(Util.Actress.getNames(data2));
			} else {
				result = data1 > data2 ? 1 : -1;
			}
			return result;
		};
		const matchTag = (tag, flay) => {
			if (flay.video.tags.includes(tag.id)) {
				// id
				return true;
			} else if (flay.title.indexOf(tag.name) > -1) {
				// name
				return true;
			} else {
				// description
				var descArray = tag.description.split(',');
				if (descArray.length > 0) {
					for (var y in descArray) {
						var desc = descArray[y].trim();
						if (desc.length > 0) {
							if (flay.title.indexOf(desc) > 0) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
		const getActress = (name) => {
			for (const actress of actressList) {
				if (actress.name === name) {
					return actress;
				}
			}
			return null;
		};
		const containsFavoriteActress = (actressList) => {
			if ($.isEmptyObject(actressList)) {
				return false;
			}
			for (const actressName of actressList) {
				const actress = getActress(actressName);
				if (actress.favorite) {
					return true;
				}
			}
			return false;
		};

		const loadingIndex = loading.on('Collect list');
		$('.video-wrapper').hide();

		const query = $('#search').val();
		const fav = $('#favorite').prop('checked');
		const nof = $('#noFavorite').prop('checked');
		const vid = $('#video').prop('checked');
		const sub = $('#subtitles').prop('checked');
		const rank0 = $('#rank0').prop('checked') ? '0' : '';
		const rank1 = $('#rank1').prop('checked') ? '1' : '';
		const rank2 = $('#rank2').prop('checked') ? '2' : '';
		const rank3 = $('#rank3').prop('checked') ? '3' : '';
		const rank4 = $('#rank4').prop('checked') ? '4' : '';
		const rank5 = $('#rank5').prop('checked') ? '5' : '';
		const sort = $("input[name='sort']:checked").val();
		let selectedTags = [];
		$('input[data-tag-id]:checked', '#selectTags').each(function (idx, tagCheckbox) {
			selectedTags.push($(tagCheckbox).data('tag'));
		});

		// clear tag count info
		$('input[data-tag-id]', '#selectTags').each(function (index, tagCheckbox) {
			var tag = $(tagCheckbox).data('tag');
			tag.count = 0;
			$(tagCheckbox).next().addClass('nonExist');
		});

		// filtering
		seenList = [];
		collectedList = [];
		for (const flay of flayList) {
			// video, subtitles check
			let matched = false;
			if (vid && sub) {
				// 비디오와 자막 모두 있는
				matched = flay.files.movie.length > 0 && flay.files.subtitles.length > 0;
			} else if (vid && !sub) {
				// 비디오만 있는
				matched = flay.files.movie.length > 0 && flay.files.subtitles.length === 0;
			} else if (!vid && sub) {
				// 비디오 없이 자막만 있는
				matched = flay.files.movie.length === 0 && flay.files.subtitles.length > 0;
			} else {
				matched = flay.files.movie.length > 0 || flay.files.subtitles.length > 0;
			}
			if (!matched) {
				continue;
			}

			// rank check
			var rank = rank0 + rank1 + rank2 + rank3 + rank4 + rank5;
			if (rank.indexOf(flay.video.rank) < 0) {
				continue;
			}

			// actress favorite check
			if (fav && nof) {
				// all show
			} else if (fav && !nof) {
				if (!containsFavoriteActress(flay.actressList)) {
					continue;
				}
			} else if (!fav && nof) {
				if (containsFavoriteActress(flay.actressList)) {
					continue;
				}
			} else {
				// all hide
				continue;
			}

			if (query !== '') {
				if ((flay.studio + flay.opus + flay.title + flay.actressList.join(' ') + flay.release + flay.comment).toLowerCase().indexOf(query.toLowerCase()) < 0) {
					continue;
				}
			}

			// tag check all. id, name, desc
			if (selectedTags.length > 0) {
				let found = false;
				for (const tag of selectedTags) {
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
			for (const tag of tagList) {
				if (matchTag(tag, flay)) {
					const dataTag = $("input[data-tag-id='" + tag.id + "']", '#selectTags').data('tag');
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
				case 'S':
					const sVal = compareTo(flay1.studio, flay2.studio);
					return sVal === 0 ? compareTo(flay1.opus, flay2.opus) : sVal;
				case 'O':
					return compareTo(flay1.opus, flay2.opus);
				case 'T':
					return compareTo(flay1.title, flay2.title);
				case 'A':
					const aVal = compareTo(flay1.actressList, flay2.actressList);
					return aVal === 0 ? compareTo(flay1.opus, flay2.opus) : aVal;
				case 'R':
					const rVal = compareTo(flay1.release, flay2.release);
					return rVal === 0 ? compareTo(flay1.opus, flay2.opus) : rVal;
				case 'M':
					return compareTo(flay1.lastModified, flay2.lastModified);
				case 'P':
					const pVal = compareTo(flay1.video.play, flay2.video.play);
					return pVal === 0 ? compareTo(flay1.release, flay2.release) : pVal;
			}
		});

		// collectedList show
		if (collectedList.length > 0) {
			navigation.random();
			$('.video-wrapper').show();
			loading.off(loadingIndex);
		} else {
			$('.pagination').empty();
			loading.error('Not found');
		}

		// display flay count of tag
		$('input[data-tag-id]', '#selectTags').each(function (index, tagCheckbox) {
			const tag = $(tagCheckbox).data('tag');
			$(tagCheckbox)
				.next()
				.toggleClass('nonExist', tag.count == 0)
				.empty()
				.append(tag.name, $('<i>', { class: 'badge tag-flay-count' }).html(tag.count));
		});

		// make statistics map
		const studioMap = new Map();
		const actressMap = new Map();
		let count = 1;
		for (const flay of collectedList) {
			// flay.studio
			if (studioMap.has(flay.studio)) {
				count = studioMap.get(flay.studio);
				count++;
			} else {
				count = 1;
			}
			studioMap.set(flay.studio, count);

			// flay.actressList
			for (const actressName of flay.actressList) {
				if (actressMap.has(actressName)) {
					count = actressMap.get(actressName);
					count++;
				} else {
					count = 1;
				}
				actressMap.set(actressName, count);
			}
		}

		// sort statistics map
		const studioMapAsc = new Map(
			[...studioMap.entries()].sort((a, b) => {
				return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
			}),
		);

		const actressMapAsc = new Map(
			[...actressMap.entries()].sort((a, b) => {
				return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
			}),
		);

		const minCount = 5;
		$('#statisticsStudio')
			.empty()
			.append(
				$('<label>', { class: 'text hover text-info float-left' }).append(
					$('<span>')
						.html('Show All')
						.on('click', function () {
							$('#statisticsStudio .studioTag.hide').toggle();
							$(this).html($('#statisticsStudio .studioTag.hide:visible').length > 0 ? minCount + ' over' : 'Show All');
						}),
				),
			);
		for (const [k, v] of studioMapAsc) {
			$('#statisticsStudio').append(
				$('<label>', { class: 'text hover studioTag' + (v < minCount ? ' hide' : '') })
					.append(
						$('<span>')
							.css({
								fontSize: 16 + v * 0.25,
							})
							.html(k),
						$('<span>', { class: 'badge' }).html(v),
					)
					.data('k', k)
					.on('click', function () {
						$('#search').val($(this).data('k'));
						$('#pageContent').trigger('collect');
					}),
			);
		}

		$('#statisticsActress')
			.empty()
			.append(
				$('<label>', { class: 'text hover text-info float-left' }).append(
					$('<span>')
						.html('Show All')
						.on('click', function () {
							$('#statisticsActress .actressTag.hide').toggle();
							$(this).html($('#statisticsActress .actressTag.hide:visible').length > 0 ? minCount + ' over' : 'Show All');
						}),
				),
			);
		for (const [k, v] of actressMapAsc) {
			const a = getActress(k);
			$('#statisticsActress').append(
				$('<label>', { class: 'text hover actressTag' + (v < minCount ? ' hide' : '') })
					.append(
						$('<span>')
							.css({
								fontSize: 16 + v * 1,
							})
							.append(`<i class="fa ${a.favorite ? 'fa-heart' : ''}"></i>`, k),
						$('<span>', { class: 'badge' }).html(v),
					)
					.data('k', k)
					.on('click', function () {
						$('#search').val($(this).data('k'));
						$('#pageContent').trigger('collect');
					}),
			);
		}
	}

	function showVideo() {
		const setBackgroundCover = (selector, opus) => {
			if (opus) {
				if (SessionStorageItem.has(opus)) {
					$(selector).css({ backgroundImage: `url('${SessionStorageItem.get(opus)}')` });
				} else {
					Rest.Image.blobUrl(`${PATH}/static/cover/${opus}`, (blobUrl) => {
						SessionStorageItem.set(opus, blobUrl);
						$(selector).css({ backgroundImage: `url('${blobUrl}')` });
					});
				}
			} else {
				$(selector).css({ backgroundImage: `url('${PATH}/static/image/random?_=${Date.now()}')` });
			}
		};

		navigation.off();

		// show cover
		setBackgroundCover('.cover-wrapper-inner.prev > .cover-box', collectedList[currentIndex - 1]?.opus);
		setBackgroundCover('.cover-wrapper-inner.curr > .cover-box', collectedList[currentIndex]?.opus);
		setBackgroundCover('.cover-wrapper-inner.next > .cover-box', collectedList[currentIndex + 1]?.opus);

		// show Infomation
		// studio
		$('.info-studio').html(currentFlay.studio);
		// opus
		$('.info-opus').html(currentFlay.opus);
		// title
		$('.info-title').html(currentFlay.title);
		// actress
		$('.info-wrapper-actress').empty();
		currentFlay.actressList.forEach((name) => {
			if (name === 'Amateur') {
				return;
			}

			const actress = getActress(name);
			if (actress === null) {
				throw 'not found ' + name;
			}

			const $actress = $('<div>', { class: 'info-actress' })
				.data('actress', actress)
				.append(
					$('<label>', { class: 'text info-actress-favorite hover' }).append($('<i>', { class: 'fa ' + (actress.favorite ? 'favorite fa-heart' : 'fa-heart-o') }).css('min-width', 16)),
					$('<label>', { class: 'text info-actress-name hover' }).html(name),
					$('<label>', { class: 'text info-actress-local' }).html(actress.localName),
					$('<label>', { class: 'text info-actress-flaycount' }).html('&nbsp;').neonLoading(true),
					$('<label>', { class: 'text info-actress-age' }).html(Util.Actress.getAge(actress).ifNotZero('<small>y</small>')),
					$('<label>', { class: 'text info-actress-birth' }).html(
						actress.birth.replace(/年|月|日/g, function (match, offset, string) {
							return '<small>' + match + '</small>';
						}),
					),
					$('<label>', { class: 'text info-actress-body' }).html(
						actress.body.replace(/ - /g, function (match) {
							return '<small>' + match.trim() + '</small>';
						}),
					),
					$('<label>', { class: 'text info-actress-height' }).html(actress.height.ifNotZero('<small>cm</small>')),
					$('<label>', { class: 'text info-actress-debut' }).html(actress.debut.ifNotZero('<small>d</small>')),
				)
				.appendTo($('.info-wrapper-actress'));

			Rest.Flay.findByActress(name, (foundFlayList) => {
				$actress.find('.info-actress-flaycount').html(`${foundFlayList.length}<small>F</small>`).neonLoading(false);
			});
		});
		// release
		$('.info-release').html(currentFlay.release);
		// modified
		$('.info-modified').html(new Date(currentFlay.lastModified).format('yyyy-MM-dd'));
		// video file
		const movieSize = currentFlay.files.movie.length;
		$('.info-video')
			.html(movieSize === 0 ? 'Video' : (movieSize > 1 ? movieSize + 'V ' : '') + File.formatSize(currentFlay.length))
			.toggleClass('nonExist', movieSize === 0);
		// video play
		$('.info-play')
			.html(`${currentFlay.video.play}<small>P</small>`)
			.toggle(currentFlay.video.play > 0);
		// score
		$('.info-score').neonLoading(true);
		Rest.Flay.getScore(currentFlay.opus, (score) => {
			$('.info-score')
				.html(`${score}<small>S</small>`)
				.toggle(score > 0)
				.neonLoading(false);
		});
		// subtitles
		$('.info-subtitles')
			.html('Sub')
			.toggleClass('nonExist', currentFlay.files.subtitles.length === 0)
			.parent()
			.find('.link-subtitles')
			.remove();
		/* if (currentFlay.files.subtitles.length === 0) {
			// once checked, pass
			if (!currentFlay.hasOwnProperty('checkedSubtitles')) {
				currentFlay['checkedSubtitles'] = true;
				$('.info-subtitles').neonLoading(true);
				Search.subtitlesUrlIfFound(currentFlay.opus, function (foundSubtitlesUrlList, opus) {
					if (foundSubtitlesUrlList && foundSubtitlesUrlList.length > 0) {
						if (opus === currentFlay.opus) {
							$('.info-subtitles').html(`<span class="text-info">Subtitles ${foundSubtitlesUrlList.length} found!!!</span>`);
							for (const url of foundSubtitlesUrlList) {
								$('.info-subtitles').parent().append(`<a href="${url}" class="link-subtitles"><i class="fa fa-external-link mx-1"></i></a>`);
							}
						} else {
							notice(`${opus} subtitle found ${foundSubtitlesUrlList.length}. but flay passed!`);
						}
					}
					$('.info-subtitles').neonLoading(false);
				});
			}
		} */
		// overview
		$('.info-overview-input').val(currentFlay.video.comment).hide();
		$('.info-overview')
			.html(currentFlay.video.comment == '' ? 'Overview' : currentFlay.video.comment)
			.toggleClass('nonExist', currentFlay.video.comment === '')
			.show();
		// rank
		$('#ranker').val(currentFlay.video.rank);
		$("input[name='ranker'][value='" + currentFlay.video.rank + "']").prop('checked', true);
		// tag
		$('input:checked', '#videoTags.tag-list').prop('checked', false);
		currentFlay.video.tags.forEach((tag) => {
			$("input[data-tag-id='" + tag.id + "']", '#videoTags').prop('checked', true);
		});
		// files
		$('.file-wrapper > div:not(.file-wrapper-rename)').empty();
		currentFlay.files.cover.forEach((file) => {
			$('.file-wrapper-cover').append($('<label>', { class: 'text sm' }).html(file));
		});
		currentFlay.files.movie.forEach((file) => {
			$('.file-wrapper-movie').append(
				$('<label>', { class: 'text sm' }).append(
					file,
					$('<span>', { class: 'hover text-danger' })
						.html('<i class="fa fa-times"></i>')
						.on('click', () => {
							console.log(file);
							if (confirm('Will be delete ' + currentFlay.opus + ' movie\n' + file)) {
								Rest.Flay.deleteFileOnFlay(currentFlay.opus, file, reloadCurrentFlay);
							}
						}),
				),
			);
		});
		currentFlay.files.subtitles.forEach((file) => {
			$('.file-wrapper-subtitles').append(
				$('<label>', { class: 'text sm' }).append(
					file,
					$('<span>', { class: 'hover text-danger' })
						.html('<i class="fa fa-times"></i>')
						.on('click', () => {
							console.log(file);
							if (confirm('Will be delete ' + currentFlay.opus + ' subtitles\n' + file)) {
								Rest.Flay.deleteFileOnFlay(currentFlay.opus, file, reloadCurrentFlay);
							}
						}),
				),
			);
		});
		$('#rename-studio').val(currentFlay.studio);
		$('#rename-opus').val(currentFlay.opus);
		$('#rename-title').val(currentFlay.title);
		$('#rename-actress').val(currentFlay.actressList.join(', '));
		$('#rename-release').val(currentFlay.release);
		// history chart
		if (currentFlay.video.play > 0) {
			$('.history-wrapper').show();
			Rest.History.find(currentFlay.opus, (histories) => {
				const playHistories = histories.filter((history) => history.action === 'PLAY');
				if (currentFlay.video.play !== playHistories.length) {
					currentFlay.video.play = playHistories.length;
					Rest.Video.update(currentFlay.video, () => {
						$('.info-play').html(`${currentFlay.video.play}<small>P</small>`);
					});
				}
				drawGraph(histories);
			});
		} else {
			$('.history-wrapper').hide();
		}

		navigation.on();
	}

	function destory() {
		$(document).off('keyup');
		navigation.slide.off();
	}

	function notice(msg) {
		$('.notice-bar')
			.empty()
			.append(
				$('<label>', { class: 'text sm' })
					.html(msg)
					.fadeOut(5000, function () {
						$(this).remove();
					}),
			);
	}

	function reloadCurrentFlay() {
		console.log('reloadCurrentFlay', currentFlay.opus);
		Rest.Flay.get(currentFlay.opus, (newFlay) => {
			for (let flay of flayList) {
				if (flay.opus === newFlay.opus) {
					currentFlay = flay = newFlay;
					break;
				}
			}
			showVideo();
		});
	}

	function getActress(name) {
		for (const actress of actressList) {
			if (actress.name === name) {
				return actress;
			}
		}
		return null;
	}

	attachEventListener();

	loadData();

	AmCharts.dayNames = AmCharts.translations.ko.dayNames;
	AmCharts.shortDayNames = AmCharts.translations.ko.shortDayNames;
	AmCharts.monthNames = AmCharts.translations.ko.monthNames;
	AmCharts.shortMonthNames = AmCharts.translations.ko.shortMonthNames;

	let historyChart = null;
	const firstDayOfThisYear = AmCharts.stringToDate(DateUtils.format('yyyy-01-01'), 'YYYY-MM-DD');

	function drawGraph(historyList) {
		// init variables
		const dataMap = new Map();
		const dataArray = [
			{
				date: AmCharts.stringToDate(DateUtils.format('yyyy-MM-dd'), 'YYYY-MM-DD'),
				playCount: 0,
			},
		];

		historyList.forEach((history) => {
			if (history.action === 'PLAY') {
				const key = history.date.substring(0, 10);
				if (dataMap.has(key)) {
					dataMap.get(key).push(history);
				} else {
					dataMap.set(key, [history]);
				}
			}
		});

		// convert map to array
		dataMap.forEach((val, key) => {
			dataArray.push({
				date: AmCharts.stringToDate(key, 'YYYY-MM-DD'),
				playCount: val.length,
			});
		});

		// sort ascending by date
		dataArray.sort((d1, d2) => (d1.date > d2.date ? 1 : -1));

		// add firstDayOfThisYear, if necessary
		if (dataArray[0].date.getTime() > firstDayOfThisYear.getTime()) {
			dataArray.unshift({
				date: firstDayOfThisYear,
				playCount: 0,
			});
		}

		if (historyChart === null) {
			// https://docs.amcharts.com/3/javascriptcharts/AmSerialChart
			historyChart = AmCharts.makeChart('chartdiv', {
				type: 'serial',
				theme: 'black',
				// dataProvider: dataArray,
				graphs: [
					{
						id: 'playCount',
						type: 'column',
						valueField: 'playCount',
						fillColors: '#FFFF00',
						fillAlphas: 0.8,
						lineAlpha: 0,
						// balloonText: "<b>[[value]]</b>",
						// https://docs.amcharts.com/3/javascriptcharts/AmBalloon
						balloon: {
							enabled: false,
							// drop: true,
						},
					},
				],
				// https://docs.amcharts.com/3/javascriptcharts/ChartCursor
				chartCursor: {
					limitToGraph: 'playCount',
					categoryBalloonDateFormat: 'YYYY-MM-DD',
				},
				// https://docs.amcharts.com/3/javascriptcharts/ValueAxis
				valueAxes: [
					{
						baseValue: 0,
						gridAlpha: 0.2,
						dashLength: 1,
						maximum: 1,
						minimum: 0,
					},
				],
				// https://docs.amcharts.com/3/javascriptcharts/AmSerialChart#categoryField
				categoryField: 'date',
				// https://docs.amcharts.com/3/javascriptcharts/CategoryAxis
				categoryAxis: {
					parseDates: true,
				},
			});
			console.debug('make historyChart', historyChart);
		}

		historyChart.dataProvider = dataArray;
		historyChart.validateData();
	}
})();
