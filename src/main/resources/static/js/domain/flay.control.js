
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
		this.filterCondition = {
			keyword: "",
			rank: [],
			favorite: false,
			movie: false,
			subtitles: false,
		};

		this.init();
		this.event();

		// this.filter();
		this.filteredFlayList = this.totalFlayList;
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
		$(this.selectors.eventWrap).navEvent(function (signal, e) {
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
	}

	sort(sort) {
		this.filteredFlayList.sort(function(flay1, flay2) {
			switch(sort) {
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
	}

	filter(condition) {
		this.filterCondition = $.extend({}, this.filterCondition, condition);
		console.log('filter condition merge', this.filterCondition);

		this.filteredFlayList = this.totalFlayList.filter((f) => {
			if (this.filterCondition.keyword !== "" && !f.fullname.includes(this.filterCondition.keyword)) {
				return false;
			}
			if (this.filterCondition.rank.length > 0 && !this.filterCondition.rank.includes(f.video.rank)) {
				return false;
			}
			if (this.filterCondition.favorite || this.filterCondition.movie || this.filterCondition.subtitles) {
				if (this.filterCondition.favorite && !FlayControl.isFavorite(f.actressList)) {
					return false;
				}
				if (this.filterCondition.movie && f.files.movie.length === 0) {
					return false;
				}
				if (this.filterCondition.subtitles && f.files.subtitles.length === 0) {
					return false;
				}
			}
			return true;
		});
		console.log('filtered', this.filteredFlayList);
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

	show() {
		$(this.selectors.flayWrap).empty().append(this.filteredFlayList[this.currentIndex].$());
		console.log(`show index ${this.currentIndex}`);
		this.pagination();
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
