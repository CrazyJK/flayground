const name = reqParam.name;
let actress;

const $flayList = $('.flay-list');

$(window).on('resize', function () {
	$flayList.css({
		height: window.innerHeight - $('.navbar').outerHeight() - 16,
	});
});

$('#favorite').on('click', function () {
	actress.favorite = !actress.favorite;
	var $self = $(this);
	Rest.Actress.update(actress, function () {
		if (actress.favorite) {
			$self.switchClass('fa-heart-o', 'fa-heart favorite');
		} else {
			$self.switchClass('fa-heart favorite', 'fa-heart-o');
		}
	});
});

$('#birth').on('keyup', function () {
	var value = $(this).val().trim();
	$('.actress-age').html(Util.Actress.getAge({ birth: value }));
	$(this).val(value).toggleClass('input-invalid', !birthRegExp.test(value));
});

$('#body').on('keyup', function () {
	var value = $(this)
		.val()
		.trim()
		.replace(/^[A-Z]|\(|カップ\)/gi, '')
		.replace(/\/ [A-Z]/gi, '- ');
	$(this).val(value).toggleClass('input-invalid', !bodyRegExp.test(value));
});

$('#height').on('keyup', function () {
	var value = $(this).val().trim();
	$(this).val(value).toggleClass('input-invalid', !heightRegExp.test(value));
});

$('#debut').on('keyup', function () {
	var value = $(this).val().trim();
	$(this).val(value).toggleClass('input-invalid', !debutRegExp.test(value));
});

$('#search').on('click', function () {
	var keyword = actress.localName != '' ? actress.localName : actress.name;
	Search.actress(keyword);
});

$('input:radio[name="filter"]').on('change', (e) => {
	console.log('filter', $(e.target).val());
	const filterVal = $(e.target).val();
	switch (filterVal) {
		case 'u':
			$('.flay-list > .flay-card').hide();
			$('.flay-list > .flay-card.unrank').show();
			break;
		case 'i':
			$('.flay-list > .flay-card').hide();
			$('.flay-list > .flay-card.instance').show();
			break;
		case 'a':
			$('.flay-list > .flay-card').show();
			break;
	}
});

$('#save').on('click', function () {
	var originalName = actress.name;
	actress.localName = $('#localName').val().trim();
	actress.birth = $('#birth').val().trim();
	actress.body = $('#body').val().trim();
	actress.height = $('#height').val().trim();
	actress.debut = $('#debut').val().trim();
	actress.name = $('#name').val().trim();
	actress.comment = $('#comment').val().trim();

	if (originalName != actress.name) {
		Rest.Actress.rename(originalName, actress, function () {
			location.href = '?name=' + actress.name;
		});
	} else {
		Rest.Actress.update(actress, function () {
			const loadingIndex = loading.on('Updated');
			setTimeout(() => {
				loading.off(loadingIndex);
			}, 3 * 1000);
		});
	}
});

$('#delete').on('click', function () {
	confirm('confirm your order. delete this?') &&
		Rest.Actress.delete(actress, function () {
			self.close();
		});
});

Rest.Actress.get(name, (_actress_) => {
	actress = _actress_;
	document.title = actress.name + ' - ' + document.title;

	$('#name').val(actress.name);
	$('#localName').val(actress.localName);
	$('#birth').val(actress.birth).trigger('keyup');
	$('#body').val(actress.body);
	$('#height').val(actress.height.ifNotZero());
	$('#debut').val(actress.debut.ifNotZero());
	$('#comment').val(actress.comment);
	if (!actress.favorite) {
		$('.fa-heart').removeClass('favorite fa-heart').addClass('fa-heart-o');
	}

	Promise.all([
		new Promise((resolve) => {
			Rest.Flay.findByActress(actress, resolve);
		}),
		new Promise((resolve) => {
			Rest.Flay.findByActressInArchive(actress, resolve);
		}),
	]).then(([instanceList, archiveList]) => {
		$('#avgRank').html(
			((flayList) => {
				let rankAvg = { sum: 0, cnt: 0 };
				flayList
					.filter((flay) => flay.video.rank > 0)
					.forEach((flay) => {
						rankAvg.sum += flay.video.rank;
						rankAvg.cnt++;
					});
				return (rankAvg.sum / rankAvg.cnt).toFixed(1);
			})(instanceList),
		);

		const flayAllList = [...instanceList, ...archiveList];
		flayAllList.sort((flay1, flay2) => {
			return $.trim(flay2.release).toLowerCase().localeCompare($.trim(flay1.release));
		});

		let unrankCount = 0;
		$flayList.empty();
		flayAllList.forEach((flay) => {
			unrankCount += !flay.archive && flay.video.rank === 0 ? 1 : 0;
			$flayList.appendFlayCard(flay, {
				width: 330,
				exclude: [ACTRESS, MODIFIED, RANK, COMMENT, FILEINFO],
				fontSize: '80%',
				archive: flay.archive,
				class: flay.archive ? 'archive' : 'instance' + (flay.video.rank === 0 ? ' unrank' : ''),
			});
		});

		$('.filter-cnt-unrank').html(unrankCount);
		$('.filter-cnt-instance').html(instanceList.length);
		$('.filter-cnt-all-flay').html(flayAllList.length);
	});

	if (actress.coverSize > 0) {
		$('nav.navbar').hover(
			function () {
				$('.actress-cover-wrapper').css({
					background: 'rgba(0,0,0,0.75) url("/static/actress/' + actress.name + '/' + Random.getInteger(0, actress.coverSize - 1) + '") center top / contain no-repeat',
				});
			},
			function () {},
		);
	}

	$(window).trigger('resize');
});
