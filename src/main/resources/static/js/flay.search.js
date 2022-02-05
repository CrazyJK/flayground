/**
 * Flay Search
 */

function baseSearch() {
	$('#query, #opus').on('keyup', function (e) {
		if (e.keyCode != 13) {
			return;
		}
		var keyword = $(this).val().trim().toUpperCase();
		searchSource(keyword);
	});
	$('.btn-search-opus').on('click', function () {
		var value = $('#query').val();
		Search.opus(value);
	});
	$('.btn-search-actress').on('click', function () {
		var isShow = $('#findMode').hasClass('show');
		var query = $('#query').val();
		var name = $('#actress').val();
		var value = '';
		if (isShow && name) value = name;
		else value = query;
		Search.actress(value);
	});
	$('.btn-search-torrent').on('click', function () {
		var value = $('#query').val();
		Search.torrent(value);
	});
	$('#btn-flay-close').on('click', function () {
		$('#resultFlayDiv').collapse('hide');
	});
	$('#btn-history-close').on('click', function () {
		$('#resultHistoryDiv').collapse('hide');
	});
}

function findMode() {
	const DATE_PATTERN = /^(19|20)\d{2}.(0[1-9]|1[012]).(0[1-9]|[12][0-9]|3[0-1])$/;

	$('.btn-find-random-opus').on('click', function () {
		Search.opusByRandom();
	});
	$('#btnReset').dblclick(function () {
		$('#findMode .form-control').val('').removeClass('input-empty input-invalid input-warning');
		$('#findMode input:checkbox').prop('checked', false).next().find('i.fa').removeClass('fa-heart').addClass('fa-heart-o');
		$('#newActress').data('actress', null);
	});
	$('#btnCopy').on('click', () => {
		const rowOpus = $('#rowname_opus').val().trim();
		const rowTitle = $('#rowname_title').val().trim();
		const rowDesc = $('#videoDescription').val().trim();
		console.log('btnCopy click', rowOpus, rowTitle, rowDesc);

		Rest.Video.get(
			rowOpus,
			(video) => {
				// success
				video['title'] = rowTitle;
				video['desc'] = rowDesc;
				console.log('video', video);

				Rest.Video.update(video);
			},
			() => {
				// fail
				const video = new Object();
				video['opus'] = rowOpus;
				video['title'] = rowTitle;
				video['desc'] = rowDesc;
				video['tags'] = [];
				console.log('video', video);

				Rest.Video.save(video);
			},
		);
	});
	// 각 파트 내용을 수정하면
	$('.flay-group > input').on('keyup', function (e) {
		if (e.keyCode === 17) return;

		let fullname = '';
		$('.flay-group > input').each(function () {
			const id = $(this).attr('id');
			let value = $(this).val().trim();
			if (id === 'opus') {
				value = value.toUpperCase();
				$('#query').val(value);
			} else if (id === 'actress') {
				$('#newActressName').val(value);
			} else if (id === 'release') {
				value = value.replace(/(\d{4})(\d{2})(\d{2})/g, '$1.$2.$3');
				$(this).val(value);

				var isValid = DATE_PATTERN.test(value);
				$(this).toggleClass('input-invalid', !isValid);
				if (isValid) $(this).toggleClass('input-warning', value.indexOf(new Date().format('yyyy')) < 0);
				else $(this).removeClass('input-warning');
			}
			fullname += '[' + value + ']';
			$(this).toggleClass('input-empty', value === '');
		});
		$('input#fullname').val(File.validName(fullname)).effect('highlight', {}, 200);
	});
	// 첫줄 입력시
	$('#rowname_opus, #rowname_title, #rowname_actress').on('keyup', function (e) {
		if (e.keyCode !== 13) {
			return;
		}

		// var titlePart = $.trim($(this).val().replace(/\[|]/gi, ' ')).split(' ');
		// if (titlePart.length > 1) {
		// 	$('#rowname_opus').val(titlePart[0]);
		// 	$('#rowname_title').val(titlePart.slice(1).join(' '));
		// 	$('#rowname_actress').val(titlePart[titlePart.length - 1]);
		// }

		const rowOpus = $('#rowname_opus').val().trim();
		const rowTitle = $('#rowname_title').val().trim();
		const rowName = $('#rowname_actress').val().trim();
		const rowDesc = $('#videoDescription').val().trim();

		$('#opus').val(rowOpus);
		if (rowOpus !== '') {
			searchSource(rowOpus);
			Search.opus(rowOpus);
		}
		if (rowTitle !== '') {
			// Search.translateByGoogle(rowTitle);
			Search.translateByPapago(encodeURI(rowTitle + ' ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ ' + rowDesc));
		}
		if (rowName !== '') {
			rowName.split(' ').forEach((name) => {
				if (name.trim().length === 0) {
					return;
				}
				Rest.Actress.findByLocalname(name, function (actressList) {
					console.log('findByLocalname', name, actressList.length);

					$('#newActressName').val('');
					$('#newActressLocal').val(name);
					$('#newActressBirth').val('');
					$('#newActressBody').val('');
					$('#newActressHeight').val('');
					$('#newActressDebut').val('');

					if (actressList.length == 0) {
						Search.actress(name);
					} else if (actressList.length == 1) {
						const actressVal = $('#actress').val();
						if (actressVal !== '') {
							$('#actress').val(actressVal + ', ' + actressList[0].name);
						} else {
							$('#actress').val(actressList[0].name);
						}
						$('#actress').effect('highlight', {}, 1000);
						transferActressInfo(actressList[0], '#rowname_actress');
					} else {
						Search.actress(name);
						$('#actressChoice > ul').empty();
						$.each(actressList, function (idx, actress) {
							$('<li>')
								.append(
									$('<label>', { class: 'text hover' })
										.append($('<i>', { class: 'fa fa-female' }))
										.on('click', function () {
											View.actress(actress.name);
										}),
									$('<label>', { class: 'text hover' })
										.html(actress.name + ' ' + actress.localName + ' ' + actress.birth + ' ' + actress.body + ' ' + actress.height + ' ' + actress.debut)
										.on('click', function () {
											$(this).effect('transfer', { to: '#actress', className: 'ui-effects-transfer' }, 500, function () {
												$('#actress').val(actress.name);
												$('#actressChoice').dialog('close');
												transferActressInfo(actress, '#actress');
											});
										}),
								)
								.appendTo($('#actressChoice > ul'));
						});
						$('#actressChoice').dialog({
							width: 600,
						});
					}
				});
			});
		}
	});
	$('#newActressBirth').on('keyup', function () {
		var value = $(this).val().trim();
		$(this).val(value).toggleClass('input-invalid', !birthRegExp.test(value));
	});
	$('#newActressBody').on('keyup', function (e) {
		if (e.keyCode === 17) return;

		var value = $(this)
			.val()
			.trim()
			.replace(/^[A-Z]|\(|カップ\)/gi, '')
			.replace(/\/ [A-Z]/gi, '- ');
		$(this).val(value).toggleClass('input-invalid', !bodyRegExp.test(value));
	});
	$('#newActressDebut').attr('max', new Date().getFullYear());
	$('#newActressDebut').on('keyup', (e) => {
		if (e.keyCode === 13) {
			resistActress();
		}
	});
	$('#btnRegistActress').on('click', resistActress);
	function resistActress() {
		var actress = $('#newActress').data('actress');
		if (actress && actress.name === $('#newActressName').val().trim()) {
			actress.favorite = $('#newActressFavorite').prop('checked');
			actress.localName = $('#newActressLocal').val().trim();
			actress.birth = $('#newActressBirth').val().trim();
			actress.body = $('#newActressBody').val().trim();
			actress.height = $('#newActressHeight').val().trim();
			actress.debut = $('#newActressDebut').val().trim();
		} else {
			actress = {};
			actress.favorite = $('#newActressFavorite').prop('checked');
			actress.name = $('#newActressName').val().trim();
			actress.localName = $('#newActressLocal').val().trim();
			actress.birth = $('#newActressBirth').val().trim();
			actress.body = $('#newActressBody').val().trim();
			actress.height = $('#newActressHeight').val().trim();
			actress.debut = $('#newActressDebut').val().trim();
			actress.comment = '';
			actress.coverSize = 0;
		}
		Rest.Actress.persist(actress);
	}
	$('#btnShowActress').on('click', function () {
		var newActressName = $('#newActressName').val().trim();
		if (newActressName !== '') {
			View.actress(newActressName);
		}
	});
	$('#newActressRowdata')
		.on('keyup', function (e) {
			if (e.keyCode === 17) {
				// Control key ignored
				return;
			}
			$(this)
				.val()
				.split('\n')
				.forEach((line) => {
					// console.log(line);
					if (/[0-9]年/.test(line)) {
						// 1987年09月07日 （現在 34歳）おとめ座
						const birth = line.split(' ')[0];
						$('#newActressBirth').val(birth).trigger('keyup');
					} else if (line.indexOf('T') > -1) {
						// T161 / B83(Eカップ) / W58 / H82 / S
						const splitText = line.split(' / ');
						const height = splitText[0].substring(1);
						const body = splitText[1] + ' / ' + splitText[2] + ' / ' + splitText[3];
						$('#newActressBody').val(body).trigger('keyup');
						$('#newActressHeight').val(height);
					}
				});
		})
		.attr({
			placeholder: `input: 1999年12月01日 （現在 21歳）いて座
サイズ

T163 / B92(Hカップ) / W62 / H89`,
		})
		.css({ height: 100 });

	function transferActressInfo(actress, from) {
		$(from).effect('transfer', { to: '#newActress', className: 'ui-effects-transfer' }, 500, function () {
			$('#newActress').data('actress', actress);
			$('#newActressFavorite').prop('checked', actress.favorite);
			$('#newActressFavorite ~ span > i').toggleClass('fa-heart', actress.favorite).toggleClass('fa-heart-o', !actress.favorite);
			$('#newActressName').val(actress.name);
			$('#newActressBirth').val(actress.birth);
			$('#newActressBody').val(actress.body);
			$('#newActressHeight').val(actress.height);
			$('#newActressDebut').val(actress.debut);
		});
	}
}

function candidateMode() {
	$('#btnGetCandidates').on('click', function () {
		Rest.Flay.findCandidates(function (flayList) {
			$('#candidatesCount').html(flayList.length).show();
			$('#btnFileControl, #toggleCandidatesCover').toggle(flayList.length > 0);
			const $candidatesList = $('#candidatesList').empty();
			if (flayList.length === 0) {
				return;
			}
			$.each(flayList, function (idx, flay) {
				$('<div>', { class: 'candidates list-group-item' })
					.append(
						$('<button>', { class: 'btn btn-sm btn-block btn-outline-warning' })
							.append($('<strong>').html('Acept'), $('<span>', { class: 'badge badge-light mx-2' }).html(flay.files.candidate.length), flay.files.candidate.toString().replace(/,/gi, '<br>').replace(/\\/gi, '/').replace(/\//gi, '<b class="text-white"> / </b>'))
							.on('click', function () {
								var $self = $(this);
								Rest.Flay.acceptCandidates(flay, function () {
									$self.hide().closest('.candidates').addClass('accepted').appendTo($candidatesList).find('.candidates-files, .candidates-cover').remove();
									$('#candidatesCount').html(parseInt($('#candidatesCount').text()) - 1);
								});
							}),
						$('<div>', { class: 'candidates-files' }).append(
							(function () {
								var files = [];
								$.each(flay.files.candidate, function (idx, file) {
									files.push(
										$('<p>', { class: 'm-1 text-danger' }).append(
											file,
											$('<button>', { class: 'btn btn-sm btn-link text-danger ml-2' })
												.html('Delete')
												.on('click', function () {
													$(this).hide();
													$(this).next().show();
												}),
											$('<button>', { class: 'btn btn-sm btn-link text-danger ml-2' })
												.css({ display: 'none' })
												.html('Are U sure?')
												.on('click', function () {
													var $p = $(this).parent();
													var $b = $(this).parent().parent().prev();
													Rest.Flay.deleteFile(file, function () {
														$p.hide();
														$b.hide();
													});
												}),
										),
									);
								});
								return files;
							})(),
						),
						$('<div>', { class: 'candidates-info' }).append(
							$('<label>', { class: 'text sm candidates-info-studio' }).html(flay.studio),
							$('<label>', { class: 'text sm candidates-info-opus hover' })
								.html(flay.opus)
								.on('click', function () {
									View.flay(flay.opus);
								}),
							$('<label>', { class: 'text sm candidates-info-title' }).html(flay.title),
							$('<label>', { class: 'text sm candidates-info-actress' }).html(flay.actressList.toString()),
							$('<label>', { class: 'text sm candidates-info-release' }).html(flay.release),
							$('<label>', { class: 'text sm candidates-info-ext' }).append(
								$('<span>', { class: 'mx-1' })
									.html('r ' + flay.video.rank)
									.addClass(flay.video.rank !== 0 ? 'text-danger' : ''),
								$('<span>', { class: 'mx-1' })
									.html('v ' + flay.files.movie.length)
									.addClass(flay.files.movie.length !== 0 ? 'text-danger' : ''),
								$('<span>', { class: 'mx-1' })
									.html('s ' + flay.files.subtitles.length)
									.addClass(flay.files.subtitles.length !== 0 ? 'text-danger' : ''),
							),
						),
						$('<div>', { class: 'candidates-cover' }).append($('<img>', { src: '/static/cover/' + flay.opus, class: 'img-thumbnail m-auto', id: 'cover-' + flay.opus })),
					)
					.appendTo($candidatesList);
			});
		});
	});

	$('#btnFileControl').on('click', function () {
		$('.candidates-files').slideToggle();
	});
	$('#toggleCandidatesCover').on('click', () => {
		$('.candidates-cover').slideToggle();
	});
}

function imageDownloadMode() {
	$('.btn-download-page-image').on('click', function () {
		Rest.Image.download($('#downloadPageImageForm').serialize(), function (result) {
			$('#notice > p')
				.empty()
				.append(
					$('<ul>', { class: 'list-unstyled' }).append(
						$('<li>', { class: 'text-info' }).html((result.images ? result.images.length : 0) + ' images'),
						$('<li>', { class: 'text-primary' }).append(
							$('<span>', { class: 'btn btn-link text-dark' })
								.on('click', function () {
									Rest.Flay.openFolder(result.localPath);
								})
								.html(result.localPath),
						),
					),
				);
			$('#notice').dialog({
				classes: {
					'ui-dialog': result.result ? 'ui-widget-shadow' : 'ui-dialog-danger',
				},
				width: 500,
				height: 200,
				title: result.message,
			});
			LocalStorageItem.set('DOWNLOAD_LOCAL_PATH', $('#downloadDir').val());
		});
	});
	$('#downloadDir').val(LocalStorageItem.get('DOWNLOAD_LOCAL_PATH', ''));
}

function batchMode() {
	Rest.Batch.getOption('S', function (val) {
		$(".btn-batch-option[data-type='S']").children().toggleClass('fa-check', val);
	});

	$('.btn-batch-start').on('click', function () {
		var type = $(this).data('type');
		var title = $(this).text();
		Rest.Batch.start(type, title);
	});
	$('.btn-batch-option').on('click', function () {
		var $this = $(this);
		var type = $this.data('type');
		Rest.Batch.setOption(type, function (result) {
			$this.children().toggleClass('fa-check', result);
		});
	});
}

function reloadMode() {
	$('.btn-reload').on('click', function () {
		Rest.Batch.reload();
	});
}

/**
 * find Flay
 * find video info
 * find history
 * find Studio name by opus
 * @param {*} keyword
 * @returns
 */
function searchSource(keyword) {
	keyword = $.trim(keyword);
	if (keyword.length === 0) {
		return;
	}

	var rexp = eval('/' + keyword + '/gi');
	keyword = keyword.toUpperCase();

	// find Flay
	Rest.Flay.find(keyword, function (flayList) {
		$('#resultFlayDiv').collapse('show');

		$('.flay-count').html(flayList.length);
		var $tbody = $('#foundFlayList').empty();
		if (flayList.length > 0) {
			$.each(flayList, function (entryIndex, flay) {
				$('<tr>')
					.append(
						$('<td>').append($('<label>', { class: 'text sm nowrap' }).html(flay.studio)),
						$('<td>').append(
							$('<label>', { class: 'text sm nowrap hover' })
								.html(flay.opus)
								.on('click', function () {
									View.flay(flay.opus);
								}),
						),
						$('<td>', { class: 'nowrap' })
							.append($('<label>', { class: 'text sm' }).html(flay.files.movie.length > 0 ? 'V ' + File.formatSize(flay.length) : 'noV'), $('<label>', { class: 'text sm' }).html(flay.files.subtitles.length > 0 ? 'S' : ''), $('<label>', { class: 'text sm' }).html('R' + flay.video.rank), $('<label>', { class: 'text sm' }).html())
							.css({ minWidth: 100 }),
						$('<td>').append(function () {
							var objs = [];
							$.each(flay.actressList, function (idx, actress) {
								if (actress != 'Amateur') {
									objs.push(
										$('<label>', { class: 'text sm nowrap hover' })
											.html(actress)
											.on('click', function () {
												View.actress(actress);
											}),
									);
								}
							});
							return objs;
						}),
						$('<td>').append($('<label>', { class: 'text sm' }).html(flay.release)),
						$('<td>', { class: 'nowrap' }).append($('<label>', { class: 'text sm' }).html(flay.title)),
					)
					.appendTo($tbody);
			});
			// animate
			$('div.container').animate(
				{
					backgroundColor: 'rgba(255, 255, 0, .75)',
				},
				3000,
				function () {
					$(this).animate(
						{
							backgroundColor: 'rgba(255, 255, 0, 0)',
						},
						3000,
					);
				},
			);
			// highlight
			$tbody.find('label').each(function () {
				$(this).html(
					$(this)
						.text()
						.replace(rexp, '<mark>' + keyword + '</mark>'),
				);
			});
		} else {
			$('<tr>')
				.append($('<td>', { colspan: 6, class: 'text-danger' }).html('Not found'))
				.appendTo($tbody);
		}
	});

	// find video info
	Rest.Video.find(keyword, function (list) {
		var videoList = list;
		var $tbody = $('#foundVideoList').empty();
		$('.video-count').html(videoList.length);
		if (videoList.length > 0) {
			$.each(videoList, function (entryIndex, video) {
				$('<tr>')
					.append(
						$('<td>').append(
							$('<label>', { class: 'text sm nowrap hover' })
								.html(video.opus)
								.on('click', function () {
									View.flay(video.opus);
								}),
						),
						$('<td>').append($('<label>', { class: 'text sm' }).html('Rank ' + video.rank)),
						$('<td>').append($('<label>', { class: 'text sm' }).html('Play ' + video.play)),
						$('<td>').append($('<label>', { class: 'text sm' }).html(video.lastAccess.toDate('yyyy-MM-dd hh:mm:ss'))),
					)
					.appendTo($tbody);
			});
			// highlight
			$tbody.find('label').each(function () {
				$(this).html(
					$(this)
						.text()
						.replace(rexp, '<mark>' + keyword + '</mark>'),
				);
			});
		} else {
			$('<tr>')
				.append($('<td>', { colspan: 4, class: 'text-danger' }).html('Not found'))
				.appendTo($tbody);
		}
	});

	// find history
	Rest.History.find(keyword, function (historyList) {
		const sortedHisoryList = historyList.filter((h) => h.action !== 'UPDATE');

		$('#resultHistoryDiv').collapse('show');
		$('.history-count').html(sortedHisoryList.length);

		var $tbody = $('#foundHistoryList').empty();
		$.each(sortedHisoryList, function (entryIndex, history) {
			$('<tr>')
				.append(
					$('<td>').append($('<label>', { class: 'text sm nowrap' }).html(history.date)),
					$('<td>').append(
						$('<label>', { class: 'text sm nowrap' })
							.html(history.opus)
							.on('click', function () {
								View.flay(history.opus);
							}),
					),
					$('<td>').append($('<label>', { class: 'text sm' }).html(history.action)),
					$('<td>').append($('<label>', { class: 'text sm nowrap' }).html(history.desc)),
				)
				.appendTo($tbody);
		});
		if (sortedHisoryList.length === 0) {
			$('<tr>')
				.append($('<td>', { colspan: 4, class: 'text-danger' }).html('Not found'))
				.appendTo($tbody);
		}

		$tbody.find('label').each(function () {
			$(this).html(
				$(this)
					.text()
					.replace(rexp, '<mark>' + keyword + '</mark>'),
			);
		});
	});

	// find Studio name by opus
	Rest.Studio.findOneByOpus(keyword, function (studio) {
		$('#studio').val(studio.name).effect('highlight', {}, 1000);
	});
}

// activate
baseSearch();
findMode();

if (isAdmin) {
	candidateMode();
	imageDownloadMode();
	batchMode();
	reloadMode();
} else {
	$("[aria-role='ADMIN']").empty().hide();
}
