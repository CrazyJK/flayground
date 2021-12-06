/**
 * flay archive
 */

var FLAY_ARCHIVE_VIEWTYPE = 'flay.archive.viewType';
var FLAY_ARCHIVE_PAGESIZE = 'flay.archive.pageSize.';
var pageNo = 0,
	keyword,
	total = 0,
	viewType = LocalStorageItem.get(FLAY_ARCHIVE_VIEWTYPE, 't'),
	pageSize = LocalStorageItem.getInteger(FLAY_ARCHIVE_PAGESIZE + viewType, 15);
var flayArchiveList = [];

function addEventListenerForArchive() {
	console.log('addEventListener');
	$('#pageSize')
		.val(pageSize)
		.on('keyup', function (e) {
			if (e.keyCode != 13) return;
			LocalStorageItem.set(FLAY_ARCHIVE_PAGESIZE + viewType, $(this).val());
			showDetail('off');
			goPage('current');
		});

	$("input[name='viewType']").on('change', function () {
		viewType = $("input[name='viewType']:checked").val();
		if (viewType === 't') {
			$('#tableView').show();
			$('#cardView').hide();
		} else if (viewType === 'c') {
			$('#tableView').hide();
			$('#cardView').show();
		}
		LocalStorageItem.set(FLAY_ARCHIVE_VIEWTYPE, viewType);
		showDetail('off');
		goPage('current');
	});

	$("input[name='viewType'][value='" + viewType + "']")
		.parent()
		.click();

	$('#btnCloseDetailView').on('click', function () {
		showDetail('off');
	});

	$('#keyword').on('keyup', function (e) {
		if (e.keyCode === 13) goPage(1);
	});

	$('.marker-previous').on('click', function () {
		var idx = $('#detailViewInner').data('idx');
		showDetail(--idx);
	});
	$('.marker-next').on('click', function () {
		var idx = $('#detailViewInner').data('idx');
		showDetail(++idx);
	});

	$(window)
		.on('resize', function () {
			var windowHeight = $(window).height();
			var topHeight = $('#topMenu').height() + 8;
			var bottomHeight = $('#bottomMenu').height() + 8;

			$('#contentWrapper').css({
				height: windowHeight - topHeight - bottomHeight,
				overflow: 'auto',
			});
		})
		.trigger('resize');
}

function goPage(p) {
	if (typeof p === 'string') {
		if (p === 'first') pageNo = 0;
		else if (p === 'prev') --pageNo;
		else if (p === 'next') ++pageNo;
		else if (p === 'last') pageNo = total - 1;
	} else {
		pageNo = p - 1;
	}

	pageNo = Math.max(pageNo, 0);
	pageSize = LocalStorageItem.getInteger(FLAY_ARCHIVE_PAGESIZE + viewType, 15);
	$('#pageSize').val(pageSize);
	keyword = $('#keyword').val();

	Rest.Archive.page(pageNo, pageSize, keyword, function (page) {
		flayArchiveList = page.content;

		showDetail('off');
		if (viewType === 't') {
			displayTable();
		} else if (viewType === 'c') {
			displayCard(500);
		}

		$('#totalFlayCount').html(page.totalElements + ' flay');
		pagination(page);
	});

	function displayTable() {
		var $tableList = $('#tableList');
		$tableList.empty();
		$.each(flayArchiveList, function (idx, flay) {
			$('<tr>')
				.append(
					$('<td>', { class: 'nowrap studio' }).html(flay.studio),
					$('<td>', { class: 'nowrap opus' }).append(
						$('<span>', { class: 'hover' })
							.html(flay.opus)
							.on('click', function () {
								View.flay(flay.opus);
							}),
					),
					$('<td>', { class: 'nowrap title' }).append(
						$('<label>', { class: 'rank' }).html(flay.video.rank),
						$('<i>', { class: 'fa fa-file-video-o mx-1' }).addClass(flay.files.movie.length > 0 ? '' : 'nonExist'),
						$('<i>', { class: 'fa fa-file-image-o mx-1' }).addClass(flay.files.cover.length > 0 ? '' : 'nonExist'),
						$('<i>', { class: 'fa fa-file-text-o  mx-1' }).addClass(flay.files.subtitles.length > 0 ? '' : 'nonExist'),
						$('<span>', { class: 'ml-1 hover' })
							.html(flay.title)
							.on('click', function () {
								showDetail(idx);
							}),
					),
					$('<td>', { class: 'nowrap actress' }).html(flay.actressList.toString()),
					$('<td>', { class: 'nowrap release' }).html(flay.release),
				)
				.appendTo($tableList);
		});
	}

	function displayCard(width) {
		var $cardList = $('#cardList');
		var halfSize = Math.round(width * 0.46);
		$cardList.empty();
		$.each(flayArchiveList, function (idx, flay) {
			$('<div>', { class: 'card m-2' })
				.css({
					display: 'inline-block',
					width: halfSize,
				})
				.append(
					$('<div>', { class: 'card-img-top', src: '/static/cover/' + flay.opus }).css({
						width: halfSize - 2,
						height: Math.round(width * COVER_RATIO),
						background: 'url(/static/cover/' + flay.opus + ') right top / cover no-repeat',
					}),
					$('<div>', { class: 'card-body p-2' })
						.css({
							borderBottomLeftRadius: 4,
							borderBottomRightRadius: 4,
						})
						.append(
							$('<h5>', { class: 'card-title flay-info nowrap hover m-0', title: flay.title })
								.html(flay.title)
								.on('click', function () {
									showDetail(idx);
								}),
							$('<p>', { class: 'card-text flay-info nowrap' })
								.css({
									minHeight: 24,
								})
								.html(flay.actressList.toString()),
						),
				)
				.appendTo($cardList);
		});
	}

	function pagination(page) {
		pageNo = page.number;
		total = page.totalPages;
		var base = Math.floor(page.number / 10) * 10;
		var start = base + 1,
			end = Math.min(base + 10, page.totalPages);

		for (var i = 1; i <= 10; ++i) {
			$('#page_' + i)
				.attr('href', 'javascript:goPage(' + start + ')')
				.html(start)
				.parent()
				.removeClass('active disabled');
			if (start - 1 == pageNo) {
				$('#page_' + i)
					.parent()
					.addClass('active');
			}
			if (start > total) {
				$('#page_' + i)
					.parent()
					.addClass('disabled');
			}
			++start;
		}

		if (page.first) {
			$('#page-first, #page-prev').addClass('disabled');
		} else {
			$('#page-first, #page-prev').removeClass('disabled');
		}

		if (page.last) {
			$('#page-next, #page-last').addClass('disabled');
		} else {
			$('#page-next, #page-last').removeClass('disabled');
		}
	}
}

function showDetail(idx) {
	if (typeof idx === 'string' && idx === 'off') {
		$('#detailView').slideUp();
	} else if (typeof idx === 'number') {
		var flay = flayArchiveList[idx];
		if (flay) {
			$('#detailViewInner')
				.data('idx', idx)
				.empty()
				.appendFlayCard(flay, {
					exclude: [FILEINFO, ACTRESS_EXTRA, MODIFIED],
				});
			$('#detailView').slideDown();
		}
	}
}

addEventListenerForArchive();

console.log(addEventListener);
