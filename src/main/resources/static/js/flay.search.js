/**
 * Flay Search
 */

function baseSearch() {
	console.log('baseSearch(');
	$("#query, #opus").on("keyup", function(e) {
		if (e.keyCode != 13) {
			return;
		}
		var keyword = $(this).val().trim().toUpperCase();
		searchSource(keyword);
	});
	$(".btn-search-opus").on("click", function() {
		var value = $("#query").val();
		Search.opus(value);
	});
	$(".btn-search-actress").on("click", function() {
		var isShow = $("#findMode").hasClass("show");
		var query = $("#query").val();
		var name = $("#actress").val();
		var value = '';
		if (isShow && name)
			value = name;
		else 
			value = query;
		Search.actress(value);
	});
	$(".btn-search-torrent").on("click", function() {
		var value = $("#query").val();
		Search.torrent(value);
	});
	$("#btn-video-close").on("click", function() {
		$("#resultVideoDiv").collapse('hide');
	});
	$("#btn-history-close").on("click", function() {
		$("#resultHistoryDiv").collapse('hide');
	});
}

function findMode() {
	$(".btn-find-random-opus").on("click", function() {
		Search.opusByRandom();
	});
	$("#btnReset").on("click", function() {
		$("#findMode input.form-control").val("").removeClass("input-empty input-invalid");
		$("#findMode input:checkbox").prop("checked", false);
		$("#newActress").data("actress", null);
	});
	$(".flay-group > input").on("keyup", function(e) {
		if (e.keyCode === 17) return;

		var fullname = "";
		$(".flay-group > input").each(function() {
			var id = $(this).attr("id");
			var value = $(this).val().trim();
			if (id === "opus") {
				value = value.toUpperCase();
				$("#query").val(value);
			} else if (id === "actress") {
				$("#newActressName").val(value);
			}
			fullname += '[' + value + ']';
			$(this).toggleClass("input-empty", value === '');
		});
		$("input#fullname").val(fullname).effect("highlight", {}, 200);
	});
	$("#release").on("keyup", function() {
		var dateText = $(this).val().trim();
		var date_pattern = /^(19|20)\d{2}.(0[1-9]|1[012]).(0[1-9]|[12][0-9]|3[0-1])$/;
		var isValid = date_pattern.test(dateText);
		$(this).toggleClass('input-invalid', !isValid);
		if (isValid)
			$(this).toggleClass('input-warning', dateText.indexOf('2019') < 0);
		else
			$(this).removeClass('input-warning');
	});
	$("#rowname_opus, #rowname_title, #rowname_actress").on("keyup", function(e) {
		if (e.keyCode != 13) return;
		
		var rowOpus    = $("#rowname_opus").val().trim();
		var rowTitle   = $("#rowname_title").val().trim();
		var rowActress = $("#rowname_actress").val().trim();

		$("#opus").val(rowOpus);
		rowOpus != '' && searchSource(rowOpus);
		rowOpus != '' && Search.opus(rowOpus);
		rowTitle != '' && Search.translate(rowTitle);
		rowActress != '' && Rest.Actress.findByLocalname(rowActress, function(actressList) {
			console.log('findByLocalname', rowActress, actressList.length);

			$("#newActressName"  ).val("");
			$("#newActressLocal" ).val(rowActress);
			$("#newActressBirth" ).val("");
			$("#newActressBody"  ).val("");
			$("#newActressHeight").val("");
			$("#newActressDebut" ).val("");
			
			if (actressList.length == 0) {
				Search.actress(rowActress);
			} else if (actressList.length == 1) {
				$("#actress").val(actressList[0].name).effect("highlight", {}, 1000);
				transferActressInfo(actressList[0], "#rowname_actress");
			} else {
				Search.actress(rowActress);
				$("#actressChoice > ul").empty();
				$.each(actressList, function(idx, actress) {
					$("<li>").append(
							$("<label>", {'class': 'text hover'}).append(
									$("<i>", {'class': 'fa fa-female'})
							).on("click", function() {
								View.actress(actress.name);
							}),
							$("<label>", {'class': 'text hover'}).html(actress.name + ' ' + actress.localName + ' ' + actress.birth + ' ' + actress.body + ' ' + actress.height + ' ' + actress.debut).on("click", function() {
								$(this).effect("transfer", {to: "#actress", className: "ui-effects-transfer"}, 500, function() {
									$("#actress").val(actress.name);
									$("#actressChoice").dialog("close");
									transferActressInfo(actress, "#actress");
								});
							})
					).appendTo($("#actressChoice > ul"));
				});
				$("#actressChoice").dialog({
					width: 600
				});
			}
		});
	});
	$("#newActressBirth").on("keyup", function(e) {
		var value = $(this).val().trim();
		$(this).val(value);
	});
	$("#newActressBody").on("keyup", function(e) {
		if (e.keyCode === 17) return;

		var value = $(this).val().trim();
		if (value[0] === 'B') {
			value = value.substring(1, value.length);
		}
		var replace = value.replace('(', '').replace('カップ)', '').replace('W', '').replace('H', '').replace(/\//gi, '-');
		$(this).val(replace);
	});
	$("#btnRegistActress").on("click", function() {
		var actress = $("#newActress").data("actress");
		if (actress && actress.name === $("#newActressName").val().trim()) {
			actress.favorite  = $("#newActressFavorite").prop("checked");
			actress.localName = $("#newActressLocal").val().trim();
			actress.birth     = $("#newActressBirth").val().trim();
			actress.body      = $("#newActressBody").val().trim();
			actress.height    = $("#newActressHeight").val().trim();
			actress.debut     = $("#newActressDebut").val().trim();
		} else {
			actress = {};
			actress.favorite  = $("#newActressFavorite").prop("checked");
			actress.name      = $("#newActressName").val().trim();
			actress.localName = $("#newActressLocal").val().trim();
			actress.birth     = $("#newActressBirth").val().trim();
			actress.body      = $("#newActressBody").val().trim();
			actress.height    = $("#newActressHeight").val().trim();
			actress.debut     = $("#newActressDebut").val().trim();
			actress.comment   = "";
			actress.coverSize = 0;
		}
		Rest.Actress.persist(actress);
	});

	function transferActressInfo(actress, from) {
		$(from).effect("transfer", {to: "#newActress", className: "ui-effects-transfer"}, 500, function() {
			$("#newActress").data("actress", actress);
			$("#newActressFavorite").prop("checked", actress.favorite);
			$("#newActressName"  ).val(actress.name);
			$("#newActressBirth" ).val(actress.birth);
			$("#newActressBody"  ).val(actress.body);
			$("#newActressHeight").val(actress.height);
			$("#newActressDebut" ).val(actress.debut);
		});
	}
}

function candidateMode() {
	$("#btnGetCandidates").on("click", function() {
		Rest.Flay.findCandidates(function(flayList) {
			$("#candidatesCount").show().html(flayList.length);
			$("#btnFileControl").show();
			$("#candidates").css({
				marginBottom: flayList.length > 0 ? 600 : 0
			});
			var $candidatesList = $("#candidatesList").empty();
			$.each(flayList, function(idx, flay) {
				$("<div>", {'class': 'candidates list-group-item'}).append(
						$("<button>", {'class': 'btn btn-sm btn-block btn-warning'}).append(
								$("<strong>").html('Acept'),
								$("<span>", {'class': 'badge badge-light mr-1 ml-1'}).html(flay.files.candidate.length),
								flay.files.candidate.toString().replace(/,/gi, '<br>').replace(/\\/gi, '/').replace(/\//gi, '<b class="text-white"> / </b>')
						).on("click", function() {
							var $self = $(this);
							Rest.Flay.acceptCandidates(flay, function() {
								$self.hide();
							});
						}),
						$("<div>", {'class': 'candidatesFileList'}).append(
								(function() {
									var files = [];
									$.each(flay.files.candidate, function(idx, file) {
										files.push(
												$("<p>", {'class': 'm-1 border-bottom'}).append(
														file,
														$("<button>", {'class': 'btn btn-sm btn-link text-danger ml-2'}).html("Delete").on("click", function() {
															$(this).hide();
															$(this).next().show();
														}),
														$("<button>", {'class': 'btn btn-sm btn-link text-danger ml-2'}).css({display: 'none'}).html("Are U sure?").on("click", function() {
															var $p = $(this).parent();
															var $b = $(this).parent().parent().prev();
															Rest.Flay.deleteFile(file, function() {
																$p.hide();
																$b.hide();
															});
														})
												)
										);
									});
									return files;
								}())
						),
						$("<div>").append(
								$("<label>", {'class': 'text sm'}).html(flay.studio),
								$("<label>", {'class': 'text sm hover'}).html(flay.opus).on("click", function() {
									View.flay(flay.opus);
								}),
								$("<label>", {'class': 'text sm nowrap flay-title'}).html(flay.title),
								$("<label>", {'class': 'text sm nowrap flay-actress'}).html(flay.actressList.toString()),
								$("<label>", {'class': 'text sm'}).html(flay.release),
								$("<label>", {'class': 'text sm'}).html('r ' + flay.video.rank).addClass(flay.video.rank > 0 ? "danger" : ""),
								$("<label>", {'class': 'text sm'}).html('v ' + flay.files.movie.length).addClass(flay.files.movie.length > 0 ? "danger" : ""),
								$("<label>", {'class': 'text sm'}).html('s ' + flay.files.subtitles.length).addClass(flay.files.subtitles.length > 0 ? "danger" : "")
						),
						$("<img>", {'src': '/static/cover/' + flay.opus, 'class': 'img-thumbnail m-auto', id: 'cover-' + flay.opus}),
				).appendTo($candidatesList);
			});
		});
	});
	$("#btnFileControl").on("click", function() {
		$(".candidatesFileList").slideToggle();
	});
}

function imageDownloadMode() {
	$(".btn-download-page-image").on("click", function() {
		Rest.Image.download($("#downloadPageImageForm").serialize(), function(result) {
		    $("#notice > p").empty().append(
					$("<ul>", {'class': 'list-unstyled'}).append(
							$("<li>", {'class': 'text-info'}).html(result.images.length + " images"),		
							$("<li>", {'class': 'text-primary'}).append(
									$("<span>", {'class': 'btn btn-link text-dark'}).on("click", function() {
										Rest.Flay.openFolder(result.localPath);
									}).html(result.localPath)
							)
					)
		    );
			$("#notice").dialog({
				classes: {
				    "ui-dialog": (result.result ? "ui-widget-shadow" : "ui-dialog-danger")
				},
				width: 500,
				height: 200,
				title: result.message,
			});
			LocalStorageItem.set("DOWNLOAD_LOCAL_PATH", $("#downloadDir").val());
		});	
	});
	$("#downloadDir").val(LocalStorageItem.get("DOWNLOAD_LOCAL_PATH", ""));
}

function batchMode() {
	Rest.Batch.getOption('W', function(val) {
		$(".btn-batch-option[data-type='W']").children().toggleClass("fa-check", val);
	});
	Rest.Batch.getOption('R', function(val) {
		$(".btn-batch-option[data-type='R']").children().toggleClass("fa-check", val);
	});
	Rest.Batch.getOption('S', function(val) {
		$(".btn-batch-option[data-type='S']").children().toggleClass("fa-check", val);
	});

	$(".btn-batch-start").on("click", function() {
		var type  = $(this).data("type");
		var title = $(this).text();
		Rest.Batch.start(type, title);
	});
	$(".btn-batch-option").on("click", function() {
		var $this = $(this);
		var type  = $this.data("type");
		Rest.Batch.setOption(type, function(result) {
			$this.children().toggleClass("fa-check", result);
		});
	});
}

function reloadMode() {
	$(".btn-reload").on("click", function() {
		Rest.Batch.reload();
	});
}

function searchSource(keyword) {
	keyword = $.trim(keyword);
	if (keyword.length === 0) {
		return;
	}

	var rexp = eval('/' + keyword + '/gi');
    keyword = keyword.toUpperCase();

	// find Flay
	Rest.Flay.find(keyword, function(flayList) {
		$("#resultVideoDiv").collapse('show');
		
		$(".video-count").html(flayList.length);
		var $tbody = $('#foundVideoList').empty();
		$.each(flayList, function(entryIndex, flay) {
			$("<tr>").append(
					$("<td>").append(
							$("<label>", {"class": "text sm nowrap"}).html(flay.studio)
					),
					$("<td>").append(
							$("<label>", {"class": "text sm nowrap hover"}).html(flay.opus).on("click", function() {
								View.flay(flay.opus);
							})
					),
					$("<td>", {'class': 'nowrap'}).append(
							$("<label>", {"class": "text sm"}).html(flay.files.movie.length > 0 ? "V " + File.formatSize(flay.length) : "noV"),
							$("<label>", {"class": "text sm"}).html(flay.files.subtitles.length > 0 ? "S" : ""),
							$("<label>", {"class": "text sm"}).html("R" + flay.video.rank),
							$("<label>", {"class": "text sm"}).html()
					).css({minWidth: 100}),
					$("<td>").append(
						function() {
							var objs = [];
							$.each(flay.actressList, function(idx, actress) {
								if (actress != 'Amateur') {
									objs.push(
											$("<label>", {"class": "text sm nowrap hover"}).html(actress).on("click", function() {
												View.actress(actress);
											})
									);
								}
							});
							return objs;
						}
					),
					$("<td>").append(
							$("<label>", {"class": "text sm"}).html(flay.release)
					),
					$("<td>", {'class': 'nowrap'}).append(
							$("<label>", {"class": "text sm"}).html(flay.title)
					)
			).appendTo($tbody);
		});
		if (flayList.length === 0) {
			$("<tr>").append(
					$("<td>", {'colspan': 6, 'class': 'text-danger'}).html('Not found')
			).appendTo($tbody);
		}
		
	   	$tbody.find("label").each(function() {
			$(this).html($(this).text().replace(rexp, "<mark>" + keyword + "</mark>"));
		});
	});
	
	// find history
	Rest.History.find(keyword, function(historyList) {
		$("#resultHistoryDiv").collapse('show');
		
		$(".history-count").html(historyList.length);
		var $tbody = $('#foundHistoryList').empty();
		$.each(historyList, function(entryIndex, history) {
			$("<tr>").append(
					$("<td>").append(
							$("<label>", {"class": "text sm nowrap"}).html(history.date)
					),
					$("<td>").append(
							$("<label>", {"class": "text sm nowrap"}).html(history.opus)
					),
					$("<td>").append(
							$("<label>", {"class": "text sm"}).html(history.action)
					),
					$("<td>").append(
							$("<label>", {"class": "text sm nowrap"}).html(history.desc)
					)
			).appendTo($tbody);
		});
		if (historyList.length === 0) {
			$("<tr>").append(
					$("<td>", {'colspan': 4, 'class': 'text-danger'}).html('Not found')
			).appendTo($tbody);
		}
		
	   	$tbody.find("label").each(function() {
			$(this).html($(this).text().replace(rexp, "<mark>" + keyword + "</mark>"));
		});
	});

	// find Studio name by opus
	Rest.Studio.findOneByOpus(keyword, function(studio) {
		$("#studio").val(studio.name).effect("highlight", {}, 1000);
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
