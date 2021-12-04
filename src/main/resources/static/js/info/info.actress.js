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

$('#find').on('click', function () {
	var keyword = actress.localName != '' ? actress.localName : actress.name;
	Search.find(keyword);
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

$('#unseen').on('click', function () {
	let active = $(this).data('active') !== true;
	$flayList.children().each(function (idx, flay) {
		let $flay = $(flay);
		let flayData = $flay.data('flay');
		if (active) {
			$flay.toggle(flayData.video.rank === 0 && !flayData.archive);
		} else {
			$flay.show();
		}
	});
	$(this)
		.html(active ? 'All' : 'Unseen')
		.data('active', active);
});

$('#delete').on('click', function () {
	confirm('confirm your order. delete this?') &&
		Rest.Actress.delete(actress, function () {
			self.close();
		});
});

$('#toggleArchive').on('click', () => {
	$('.archive').toggle();
});

Rest.Actress.get(name, function (_actress) {
	actress = _actress;
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

	$flayList.empty();
	var flayAllList = [];
	Rest.Flay.findByActress(actress, function (flayList) {
		$('#videoCount').val(flayList.length);

		Rest.Flay.findByActressInArchive(actress, function (flayArchiveList) {
			$('#videoCount').val(flayList.length + ' / ' + (flayList.length + flayArchiveList.length));

			flayAllList = flayList.concat(flayArchiveList);

			flayAllList.sort(function (flay1, flay2) {
				var release1 = $.trim(flay1.release);
				var release2 = $.trim(flay2.release);
				return release2.toLowerCase().localeCompare(release1);
			});

			$.each(flayAllList, function (idx, flay) {
				$flayList.appendFlayCard(flay, {
					width: 330,
					exclude: [ACTRESS, MODIFIED, RANK, COMMENT, FILEINFO],
					fontSize: '80%',
					archive: flay.archive,
				});
			});
		});
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
