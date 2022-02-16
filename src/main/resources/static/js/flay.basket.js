/**
 * basket
 *
 * @need flay.view.card.js
 */
const basket = {
	FLAY_WIDTH: 500,
	CARD_MARGIN: 4,
	$flayList: null,
	flayList: [],
	actressList: [],
	RAINBOW_COLOR: ['violet', 'indigo', 'blue', 'green', 'yellow', 'orange', 'red'],
	rainbowIndex: 0,
	totalDisplayCount: 0,
	toggleFlay: (opus, flay, styleClass, styleCss) => {
		if ($('#' + opus).length > 0) {
			$('#' + opus).hide('fade', {}, 500, function () {
				$(this).remove();
			});
		} else {
			if (!flay) {
				Rest.Flay.getSync(opus, (found) => {
					flay = found;
				});
			}
			basket.$flayList.appendFlayCard(flay, {
				width: basket.FLAY_WIDTH,
				exclude: [MODIFIED, FILEINFO, ACTRESS_EXTRA, COMMENT],
				fontSize: '80%',
				class: styleClass,
				css: styleCss,
				playCallback: (responseData, flay) => {
					$('#' + flay.opus).css({
						boxShadow: 'none',
						background: 'var(--rainbow-gradient)',
					});
				},
			});
		}
	},
	pickupFlay: () => {
		const _pickupFlay = () => {
			if (basket.flayList.length === 0) {
				Rest.Flay.findSync('rank/' + $('input:radio[name="rank"]:checked').val(), (list) => {
					const favChecked = $('#favorite').prop('checked');
					const nofChecked = $('#noFavorite').prop('checked');
					list.forEach((flay) => {
						const fav = basket.containsFavoriteActress(flay.actressList);
						if (fav) {
							if (favChecked) {
								basket.flayList.push(flay);
							}
						} else {
							if (nofChecked) {
								basket.flayList.push(flay);
							}
						}
					});
				});
				if (basket.flayList.length === 0) {
					clearInterval(timerID);
					loading.update(loadingIndex, `notfound flay`);
					return;
				}
			}

			const pickIndex = Random.getInteger(0, basket.flayList.length - 1);
			const pickedFlay = basket.flayList.splice(pickIndex, 1)[0];
			const color = basket.RAINBOW_COLOR[basket.rainbowIndex++ % basket.RAINBOW_COLOR.length];
			basket.toggleFlay(pickedFlay.opus, pickedFlay, 'card-border-0', {
				boxShadow: `inset 0 0 8px 4px ${color}, rgb(255 255 255 / 50%) 0px 0px 4px 2px`,
			});

			currDisplayCount++;
			basket.totalDisplayCount++;
			loading.update(loadingIndex, `pick up flay ${currDisplayCount} / ${maxDisplayCount} in ${basket.flayList.length}`);
			$('#flayListInfo').html(`${basket.totalDisplayCount} / ${basket.flayList.length} flay`);

			if (currDisplayCount >= maxDisplayCount || basket.flayList.length === 0) {
				basket.$flayList.css({
					justifyContent: 'space-between',
				});
				clearInterval(timerID);
				loading.off(loadingIndex);
			}
		};

		let loadingIndex = -1;
		let timerID;
		let currDisplayCount = basket.$flayList.children().length;
		let maxDisplayCount = basket.getCalculatedRowCount() * basket.getCalculatedColCount();
		if (currDisplayCount < maxDisplayCount) {
			basket.$flayList.css({
				justifyContent: 'center',
			});
			loadingIndex = loading.on(`pick up ${maxDisplayCount} flay`);
			timerID = setInterval(_pickupFlay, 500);
		}
	},
	getCalculatedRowCount: () => {
		return Math.floor(window.innerHeight / (basket.FLAY_WIDTH * COVER_RATIO + basket.CARD_MARGIN * 2));
	},
	getCalculatedColCount: () => {
		return Math.floor(window.innerWidth / (basket.FLAY_WIDTH + basket.CARD_MARGIN * 2));
	},
	emptyFlay: () => {
		basket.$flayList.hide('fade', {}, 300, () => {
			basket.$flayList.empty().show();
		});
	},
	resetList: () => {
		basket.flayList = [];

		LocalStorageItem.set('flay.basket.rank', $('input:radio[name="rank"]:checked').val());
		LocalStorageItem.set('flay.basket.favorite', $('#favorite').prop('checked'));
		LocalStorageItem.set('flay.basket.noFavorite', $('#noFavorite').prop('checked'));
	},
	setWidthOfList: () => {
		if (window.innerWidth < basket.FLAY_WIDTH) {
			basket.FLAY_WIDTH = Math.floor(window.innerWidth - basket.CARD_MARGIN * 4);
		} else if (1080 < window.innerWidth && window.innerWidth <= 1920) {
			basket.FLAY_WIDTH = Math.floor(window.innerWidth / 4 - basket.CARD_MARGIN * 4);
		}

		basket.$flayList
			.css({
				width: Math.min(Math.floor((basket.FLAY_WIDTH + basket.CARD_MARGIN * 4) * basket.getCalculatedColCount()), window.innerWidth),
			})
			.find('.flay-card')
			.css({
				flexBasis: basket.FLAY_WIDTH,
			});
	},
	containsFavoriteActress: (actressNameList) => {
		if ($.isEmptyObject(actressNameList)) {
			return false;
		}
		for (const actressName of actressNameList) {
			const actress = actressMapForCard.get(actressName);
			if (actress && actress.favorite) {
				return true;
			}
		}
		return false;
	},
};

function grapFlay(opus) {
	basket.toggleFlay(opus);
}

$(document).ready(() => {
	Rest.Actress.listSync((list) => {
		basket.actressList = list;
	});
	basket.$flayList = $('.flay-list');

	$('#rank' + LocalStorageItem.getInteger('flay.basket.rank', 0)).prop('checked', true);
	$('#favorite').prop('checked', LocalStorageItem.getBoolean('flay.basket.favorite', false));
	$('#noFavorite').prop('checked', LocalStorageItem.getBoolean('flay.basket.noFavorite', true));

	$('#pickFlay').on('click', basket.pickupFlay);
	$('#emptyFlay').on('click', basket.emptyFlay);
	$('input').on('change', basket.resetList);

	$(window).on('resize', basket.setWidthOfList).trigger('resize');
});
