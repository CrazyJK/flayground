/**
 * basket
 */
const basket = {
	FLAY_WIDTH: 500,
	CARD_MARGIN: 4,
	$flayList: null,
	flayList: [],
	RAINBOW_COLOR: ['violet', 'indigo', 'blue', 'green', 'yellow', 'orange', 'red'],
	rainbowIndex: 0,
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
			});
		}
	},
	pickupFlay: () => {
		const _pickupFlay = () => {
			if (basket.flayList.length === 0) {
				Rest.Flay.findSync('rank/' + $('#rankSelect').val(), (list) => {
					basket.flayList = list;
				});
			}

			const pickIndex = Random.getInteger(0, basket.flayList.length - 1);
			const pickedFlay = basket.flayList.splice(pickIndex, 1)[0];
			const color = basket.RAINBOW_COLOR[basket.rainbowIndex++ % basket.RAINBOW_COLOR.length];
			basket.toggleFlay(pickedFlay.opus, pickedFlay, 'card-border-0', {
				boxShadow: `inset 0 0 8px 4px ${color}, rgb(255 255 255 / 50%) 0px 0px 4px 2px`,
			});

			currDisplayCount++;
			loading.update(loadingIndex, `pick up flay ${currDisplayCount} / ${maxDisplayCount} in ${basket.flayList.length}`);

			if (currDisplayCount >= maxDisplayCount) {
				clearInterval(timerID);
				loading.off(loadingIndex);
			}
		};

		let loadingIndex = -1;
		let timerID;
		let currDisplayCount = basket.$flayList.children().length;
		let maxDisplayCount = basket.getCalculatedRowCount() * basket.getCalculatedColCount();
		if (currDisplayCount < maxDisplayCount) {
			loadingIndex = loading.on(`pick up ${maxDisplayCount} flay`);
			timerID = setInterval(_pickupFlay, 500);
		}
	},
	getCalculatedRowCount: () => {
		return parseInt(window.innerHeight / (basket.FLAY_WIDTH * COVER_RATIO + basket.CARD_MARGIN * 2), 10);
	},
	getCalculatedColCount: () => {
		return parseInt(window.innerWidth / (basket.FLAY_WIDTH + basket.CARD_MARGIN * 2), 10);
	},
	emptyFlay: () => {
		basket.$flayList.hide('fade', {}, 300, () => {
			basket.$flayList.empty().show();
		});
	},
	resetList: () => {
		basket.flayList = [];
	},
	setWidthOfList: () => {
		basket.$flayList.css({
			width: Math.min((basket.FLAY_WIDTH + basket.CARD_MARGIN * 4) * basket.getCalculatedColCount(), window.innerWidth),
		});
	},
};

function grapFlay(opus) {
	basket.toggleFlay(opus);
}

$(document).ready(() => {
	basket.$flayList = $('.flay-list');

	$('#pickFlay').on('click', basket.pickupFlay);
	$('#emptyFlay').on('click', basket.emptyFlay);
	$('#rankSelect').on('change', basket.resetList);

	$(window).on('resize', basket.setWidthOfList).trigger('resize');
});
