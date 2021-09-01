
class FlayControl {

	static totalActressMap = {};
	static isFavorite(actressNames) {
		if ($.isEmptyObject(FlayControl.totalActressMap)) {
			$.ajax({
				url: "/info/actress/map",
				async: false,
				success: (map) => {
					FlayControl.totalActressMap = map;
				}
			})
		}
		for (name of actressNames) {
			if (FlayControl.totalActressMap[name].favorite) {
				return true;
			}
		}
		return false;
	}
	static compareTo(data1, data2) {
		let result = 0;
		if (typeof data1 === 'number') {
			result = data1 - data2;
		} else if (typeof data1 === 'string') {
			result = data1.toLowerCase().localeCompare(data2.toLowerCase());
		} else if (typeof data1 === 'object') { // maybe actressList
			result = data1.toString().toLowerCase().localeCompare(data2.toString().toLowerCase());
		} else {
			result = data1 > data2 ? 1 : -1;
		}
		return result;
	}

	constructor(selectors) {
		this.selectors = selectors;

		this.currentIndex = 0;
		this.totalFlayList = [];
		this.filteredFlayList = [];

		this.init();
		this.event();
		this.filter();
		this.sort();
	}

	init() {
		$.ajax({
			url: "/flay/list",
			async: false,
			success: (list) => {
				list.forEach((item) => {
					this.totalFlayList.push(new Flay(item));
				});
				console.info(`FlayControl initiated ${this.totalFlayList.length} Flay `);
			},
		});
	}

	event() {
		const control = this;
		/*
		*	add FlayControl event listener
		*	case    1 : // wheel : up
		*	case   -1 : // wheel : down
		*/
		$(this.selectors.event).navEvent(function (signal, e) {
			console.debug("nav signal", signal, e.key);
			switch (signal) {
			case 1:
			case 37:
				control.prev();
				break;
			case -1:
			case 39:
				control.next();
				break;
			case 32:
				control.random();
				break;
			}
		});

		// filter condition change event
		$(this.selectors.filter.keyword).on("keyup", this, function (e) {
			e.stopPropagation();
			if (e.keyCode === 13) {
				e.data.filter();
			}
		});
		$(this.selectors.filter.rank
				+ ", " + this.selectors.filter.favorite
				+ ", " + this.selectors.filter.movie
				+ ", " + this.selectors.filter.subtitles).on("change", this, function (e) {
			e.stopPropagation();
			e.data.filter();
			e.data.random();
		});
		// sort condition change event
		$(this.selectors.sort).on("change", this, function (e) {
			e.stopPropagation();
			e.data.sort();
			e.data.go(0);
		});
	}

	filter() {
		const filterCondition = {
			keyword: $(this.selectors.filter.keyword).val(),
			rank: (function(rankSelector) {
				let checkedRank = [];
				$(rankSelector).each(function (idx, rank) {
					if ($(rank).prop("checked")) {
						checkedRank.push(Number(rank.value));
					}
				});
				return checkedRank;
			}(this.selectors.filter.rank)),
			favorite: $(this.selectors.filter.favorite).prop("checked"),
			movie: $(this.selectors.filter.movie).prop("checked"),
			subtitles: $(this.selectors.filter.subtitles).prop("checked"),
		};
		console.log('filterCondition', filterCondition);

		this.filteredFlayList = this.totalFlayList.filter((flay) => {
			if (filterCondition.keyword !== "" && !flay.fullname.includes(filterCondition.keyword)) {
				return false;
			}
			if (filterCondition.rank.length > 0 && !filterCondition.rank.includes(flay.video.rank)) {
				return false;
			}
			if (filterCondition.favorite || filterCondition.movie || filterCondition.subtitles) {
				if (filterCondition.favorite && !FlayControl.isFavorite(flay.actressList)) {
					return false;
				}
				if (filterCondition.movie && flay.files.movie.length === 0) {
					return false;
				}
				if (filterCondition.subtitles && flay.files.subtitles.length === 0) {
					return false;
				}
			}
			return true;
		});
		console.info(`Flay ${this.filteredFlayList.length} filtered`);
		return filterCondition;
	}

	sort() {
		const sortKey = $(this.selectors.sort + ":checked").val();
		console.log('sort method', sortKey);
		this.filteredFlayList.sort(function(flay1, flay2) {
			switch(sortKey) {
			case 's':
				const sVal = FlayControl.compareTo(flay1.studio, flay2.studio);
				return sVal === 0 ? FlayControl.compareTo(flay1.opus, flay2.opus) : sVal;
			case 'o':
				return FlayControl.compareTo(flay1.opus, flay2.opus);
			case 't':
				return FlayControl.compareTo(flay1.title, flay2.title);
			case 'a':
				const aVal = FlayControl.compareTo(flay1.actressList, flay2.actressList);
				return aVal === 0 ? FlayControl.compareTo(flay1.opus, flay2.opus) : aVal;
			case 'r':
				const rVal = FlayControl.compareTo(flay1.release, flay2.release);
				return rVal === 0 ? FlayControl.compareTo(flay1.opus, flay2.opus) : rVal;
			case 'm':
				return FlayControl.compareTo(flay1.lastModified, flay2.lastModified);
			}
		});
		return sortKey;
	}

	prev() {
		this.currentIndex--;
		if (this.currentIndex < 0) {
			this.currentIndex = this.filteredFlayList.length - 1;
		}
		this.show();
	}

	next() {
		this.currentIndex++;
		if (this.currentIndex > this.filteredFlayList.length - 1) {
			this.currentIndex = 0;
		}
		this.show();
	}

	random() {
		this.currentIndex = Math.round(Math.random() * this.filteredFlayList.length, 10);
		this.show();
	}

	go(to) {
		to = Math.max(to, 0);
		to = Math.min(to, this.filteredFlayList.length - 1);
		this.currentIndex = to;
		this.show();
	}

	show() {
		console.log(`Flay will be shown using by index ${this.currentIndex}`);
		$(this.selectors.container).empty().append(this.filteredFlayList[this.currentIndex].$());
		this.pagination();
	}

	getFlay() {
		return this.filteredFlayList[this.currentIndex];
	}

	pagination() {
		function getPagingItem(idx, control) {
			return $("<li>", {class: (idx === control.currentIndex ? "active" : "")})
					.html(idx + 1)
					.on("click", idx, function (e) {
						control.currentIndex = e.data;
						control.show();
					})
		}

		const $paging = $(this.selectors.pagination).empty();
		const lastIdx = this.filteredFlayList.length - 1;
		const lastGap = lastIdx - this.currentIndex;
		let startIdx = Math.max(this.currentIndex - 5, 0);
		let endIdx = Math.min(this.currentIndex + 5, lastIdx);

		if (lastGap < 6) {
			startIdx = Math.max(startIdx - (6 - lastGap), 0);
		}
		if (this.currentIndex < 6) {
			endIdx = Math.min(endIdx + (6 - this.currentIndex), lastIdx);
		}

		for (var i = startIdx; i <= endIdx; i++) {
			getPagingItem(i, this).appendTo($paging);
		}
		if (startIdx > 0) {
			getPagingItem(0, this).prependTo($paging);
		}
		if (endIdx < lastIdx) {
			getPagingItem(lastIdx, this).appendTo($paging);
		}
	}

}
