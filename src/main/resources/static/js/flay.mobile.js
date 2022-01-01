/**
 * Video Vertical View Javascript
 */
'use strict';

(() => {
	let flaymobile = null;

	Promise.all([
		new Promise((resolve, reject) => {
			Rest.Tag.list(resolve);
		}),
		new Promise((resolve, reject) => {
			Rest.Flay.list(resolve);
		}),
		new Promise((resolve, reject) => {
			Rest.Actress.list(resolve);
		}),
	]).then(([tagValue, flayValue, actressValue]) => {
		flaymobile = new Flaymobile(tagValue, flayValue, actressValue);
		flaymobile.init();
		flaymobile.list();
	});
})();

/**
 * flay in mobile
 *
 * iphone 13 pro max: 428 * 746 = 26.75rem * 46.625rem
 */
class Flaymobile {
	constructor(tagList, flayList, actressList) {
		this.tagList = tagList;
		this.flayList = flayList;
		this.actressList = actressList;

		this.filteredFlay = [];

		console.log('Flaymobile constructor', tagList, flayList, actressList);
		this.debug('constructor tag=' + tagList.length + ' flay=' + flayList.length + ' actress=' + actressList.length);
	}

	init() {
		console.log('Flaymobile init');

		// event
		$('header nav input:checkbox, header nav input:radio').on('change', () => {
			this.list();
		});
		$('input#search').on('keyup', (e) => {
			console.log(e.keyCode);
			this.debug('keyup: keyCode=' + e.keyCode);
			if (e.keyCode === 13) {
				this.list();
			}
		});
		// flay play
		$('#flayCover > img', '#flayCard').on('click', () => {
			this.play();
		});
		// flay rank
		$('.ranker input', '#flayCard').on('change', (e) => {
			console.log('ranker', e.target.value);
			this.debug('change ranker ' + e.target.value);
			this.flay.video.rank = e.target.value;
			Rest.Video.update(this.flay.video);
		});
		// paging
		$('#paging-first').on('click', () => {
			this.first();
		});
		$('#paging-prev').on('click', () => {
			this.prev();
		});
		$('#paging-next').on('click', () => {
			this.next();
		});
		$('#paging-last').on('click', () => {
			this.last();
		});
		$('#paging-random').on('click', () => {
			this.random();
		});
		// 가로, 세로 모드에 따른 너비 조정
		$(window)
			.on('resize', () => {
				console.log('resize', window.innerWidth, window.innerHeight);
				this.debug('resize w=' + window.innerWidth + ' h=' + window.innerHeight);
				$('body')
					.removeClass('horizontal vertical')
					.addClass(window.innerWidth > window.innerHeight ? 'horizontal' : 'vertical');
			})
			.trigger('resize');
	}

	findActress(names) {
		const found = [];
		for (const actress of this.actressList) {
			if (names.includes(actress.name)) {
				found.push(actress);
			}
		}
		return found;
	}

	isContainsFavoriteActress(flay) {
		let favorite = false;
		for (const actress of this.findActress(flay.actressList)) {
			if (actress.favorite) {
				favorite = true;
			}
		}
		return favorite;
	}

	updateActress(updatedActress) {
		console.log('updateActress', updatedActress);
		this.debug('update actress list of ' + updatedActress.name);
		for (let actress of this.actressList) {
			if (actress.name === updatedActress.name) {
				actress = updatedActress;
				break;
			}
		}
	}

	list() {
		$('#flayCard').css({
			opacity: 0,
		});

		// obtain Selected Rank
		const search = $('#search').val().trim();
		let checkedRank = [];
		const isVideo = $('#filter-video').prop('checked');
		const isSubtitles = $('#filter-subtitles').prop('checked');
		const isFavorite = $('#filter-favorite').prop('checked');
		const isNotFavorite = $('#filter-notFavorite').prop('checked');

		$('input:checkbox[name="rank"]:checked').each((i, r) => {
			console.log(i, r.value);
			checkedRank.push(parseInt(r.value));
		});
		console.log('checkedRank', checkedRank);
		this.debug('checked rank condition ' + checkedRank.join(', '));

		// obtain Filtered Flay
		this.filteredFlay = [];
		this.flayList.forEach((flay, i) => {
			// rank
			if (checkedRank.includes(flay.video.rank)) {
				// video and subtitle
				if ((!isVideo && !isSubtitles) || (isVideo && !isSubtitles && flay.files.movie.length > 0 && flay.files.subtitles.length === 0) || (!isVideo && isSubtitles && flay.files.movie.length === 0 && flay.files.subtitles.length > 0) || (isVideo && isSubtitles && flay.files.movie.length > 0 && flay.files.subtitles.length > 0)) {
					// favorite
					if ((isFavorite && this.isContainsFavoriteActress(flay)) || (isNotFavorite && !this.isContainsFavoriteActress(flay))) {
						// search
						let tagname = '';
						for (const tag of flay.video.tags) {
							tagname += tag.name + ' ';
						}
						const fullname = flay.studio + ' ' + flay.opus + ' ' + flay.title + ' ' + flay.actressList.join(' ') + ' ' + flay.release + ' ' + tagname;
						if (search.length > 0 ? fullname.indexOf(search) > -1 : true) {
							this.filteredFlay.push(flay);
						}
					}
				}
			}
		});
		console.log('filteredFlay', this.filteredFlay);
		this.debug('filtered flay ' + this.filteredFlay.length);

		// sort
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
		const sort = $("input[name='sort']:checked").val();
		this.filteredFlay.sort(function (flay1, flay2) {
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

		this.random();
	}

	first() {
		this.currentFlayIndex = 0;
		this.show();
	}

	last() {
		this.currentFlayIndex = this.filteredFlay.length - 1;
		this.show();
	}

	random() {
		this.currentFlayIndex = Random.getInteger(0, this.filteredFlay.length - 1);
		this.show();
	}

	prev() {
		if (this.currentFlayIndex > 0) {
			--this.currentFlayIndex;
		} else {
			this.currentFlayIndex = this.filteredFlay.length - 1;
		}
		this.show();
	}

	next() {
		if (this.currentFlayIndex === this.filteredFlay.length - 1) {
			this.currentFlayIndex = 0;
		} else {
			++this.currentFlayIndex;
		}
		this.show();
	}

	show() {
		$('#flayCard').css({
			opacity: 0,
		});

		// hide video
		$('#flayVideo').hide().get(0).pause();

		if (this.filteredFlay.length === 0) {
			return;
		}

		$('footer #paginationProgress .progress-bar').css({
			width: ((this.currentFlayIndex / this.filteredFlay.length) * 100).toFixed(2) + '%',
		});

		this.flay = this.filteredFlay[this.currentFlayIndex];
		console.log('show flay', this.currentFlayIndex, this.flay);
		this.debug('show flay index=' + this.currentFlayIndex);

		const movieSize = this.flay.files.movie.length;
		const subtitleSize = this.flay.files.subtitles.length;

		$('#flayCover > img', '#flayCard').attr('src', '/static/cover/' + this.flay.opus);
		$('#flayTitle', '#flayCard').html(this.flay.title);
		$('#flayRank #ranker' + this.flay.video.rank, '#flayCard').prop('checked', true);
		$('#flayActress', '#flayCard')
			.empty()
			.append(
				(() => {
					const actressHtmls = [];
					this.findActress(this.flay.actressList).forEach((a) => {
						const $actress = $(`
								<div class="actress">
									<span class="favorite"><i class="fa fa-heart${a.favorite ? '' : '-o'}"></i></span>
									<span class="name">${a.name}</span>
									<!-- <span class="localName"><small>${a.localName}</small></span> -->
									<span class="birth"><small>${a.birth.replace(/年|月|日/g, function (match) {
										return '<small>' + match + '</small>';
									})}</small></span>
									<span class="body"><small>${a.body.replace(/ - /g, function (match) {
										return '<small>' + match.trim() + '</small>';
									})}</small></span>
									<span class="height"><small>${a.height.ifNotZero('<small>cm</small>')}</small></span>
									<span class="debut"><small>${a.debut.ifNotZero('<small>d</small>')}</small></span>
								</div>`).on('click', a, (e) => {
							console.log('favorite toggle', e.target, e.data);
							this.debug('toggle actress favorite ' + e.data.name);
							const actress = e.data;
							const $favorite = $(e.target);
							actress.favorite = !actress.favorite;
							Rest.Actress.update(actress, () => {
								if (actress.favorite) {
									$favorite.switchClass('fa-heart-o', 'fa-heart');
								} else {
									$favorite.switchClass('fa-heart', 'fa-heart-o');
								}
								this.updateActress(actress);
							});
						});
						actressHtmls.push($actress);
					});
					return actressHtmls;
				})(),
			);
		$('#flayStudio', '#flayCard').html(this.flay.studio);
		$('#flayOpus', '#flayCard').html(this.flay.opus);
		$('#flayRelease', '#flayCard').html(this.flay.release);
		$('#flayMovie', '#flayCard').html(movieSize === 0 ? 'noVideo' : (movieSize > 1 ? movieSize + 'V ' : '') + File.formatSize(this.flay.length));
		$('#flaySubtitles', '#flayCard').html(subtitleSize === 0 ? '' : 'Sub');
		Rest.Flay.getScore(this.flay.opus, (score) => {
			$('#flayScore', '#flayCard').html(score.ifNotZero('<small>S</small>'));
		});
		$('#flayPlay', '#flayCard').html(this.flay.video.play.ifNotZero('<small>p</small>'));
		$('#flayOverview', '#flayCard').html(this.flay.video.comment);
		$('#flayTag', '#flayCard')
			.empty()
			.append(
				(() => {
					const tagHtmls = [];
					this.flay.video.tags.forEach((t) => {
						tagHtmls.push(`<span class="tag mr-1">${t.name}</span>`);
					});
					return tagHtmls;
				})(),
			);

		$('#flayCard').animate(
			{
				opacity: 1,
			},
			500,
		);
	}

	play() {
		console.log('play', this.flay);
		this.debug('play ' + this.flay.opus);
		$('#flayVideo')
			.attr({
				// poster: '/static/cover/' + this.flay.opus,
				src: '/stream/flay/movie/' + this.flay.opus + '/0',
			})
			.show()
			.get(0)
			.play();
	}

	debug(text) {
		const $li = $('<li>').html(text);
		$('#debug').append($li);
		setTimeout(() => {
			$li.remove();
		}, 1000 * 3);
	}
}
