/**
 * flay.all.js
 */

const $flayAllContainer = $('#flayAllContainer');

let showIntervalId = -1;
let count = 0;

function renderSequential(flayList) {
	showIntervalId = setInterval(() => {
		++count;

		const selectedFlay = flayList.splice(Random.getInteger(0, flayList.length - 1), 1)[0];

		$('.flay-item:nth-child(' + count + ')')
			.attr('title', selectedFlay.opus)
			.css({
				backgroundImage: 'url(/static/cover/' + selectedFlay.opus + ')',
			});

		if (flayList.length === 0) {
			clearInterval(showIntervalId);
		}
	}, 100);
}

function render(flayList) {
	$('.flay-item').each((index, item) => {
		const selectedFlay = flayList.splice(Random.getInteger(0, flayList.length - 1), 1)[0];
		$(item)
			.attr('data-opus', selectedFlay.opus)
			.on('click', (e) => {
				const opus = $(e.target).attr('data-opus');
				$(e.target).css({
					backgroundImage: 'url(/static/cover/' + opus + ')',
				});
			});
	});
}

function resizeContainer() {
	const itemWidth = $('.flay-item').width() + 1;
	const columnCount = Math.floor(window.innerWidth / itemWidth);
	const marginSize = window.innerWidth - columnCount * itemWidth;

	$flayAllContainer.css({
		marginLeft: marginSize / 2,
		marginRight: marginSize / 2,
	});
}

$(window).on('resize', resizeContainer);

Rest.Flay.list((list) => {
	for (let i = 0; i < list.length; i++) {
		$flayAllContainer.append(`<div class="flay-item"></div>`);
	}

	resizeContainer();
	render(list);
});
