/**
 * Flay Search
 */

$("#query, #opus").on("keyup", function(e) {
	if (e.keyCode != 13) {
		return;
	}
	var keyword = $(this).val();
	searchSource(keyword);
});

function searchSource(keyword) {
    var rexp = eval('/' + keyword + '/gi');

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

$(".flay-group > input").on("keyup", function() {
	var fullname = "";
	$(".flay-group > input").each(function() {
		var value = $(this).val();
		value = $.trim(value);
		if ($(this).attr("id") === "opus") {
			value = value.toUpperCase();
			$("#query").val(value);
		}
		fullname += '[' + value + ']';
	});
	$("input#fullname").val(fullname);
});

// rowname parsing
/*
$("#rowname").on("keyup", function(e) {
	if (e.keyCode != 13)
		return;
	
	var opus, title, name;
	var rowname = $(this).val();
	
	var braceIndex = rowname.indexOf("]");
	var secondPart = rowname.substring(braceIndex + 1);
	var minusIndex = secondPart.lastIndexOf("-");
	opus  = rowname.substring(0, braceIndex).trim();
	if (minusIndex > 0) {
		title = secondPart.substring(0, minusIndex).trim();
		name  = secondPart.substring(minusIndex + 1).trim();
	} else {
		title = secondPart
		name  = "";			
	}
	
	$("#opus").val(opus);
	searchSource(opus);
	Search.opus(opus);
	Search.translate(title);
	name != '' && Search.actress(name);
	
	console.log(opus, braceIndex, title, minusIndex, name);
});
*/

$("#rowname_opus, #rowname_title, #rowname_actress").on("keyup", function(e) {
	if (e.keyCode != 13)
		return;
	
	var rowOpus    = $("#rowname_opus").val().trim();
	var rowTitle   = $("#rowname_title").val().trim();
	var rowActress = $("#rowname_actress").val().trim();

	$("#opus").val(rowOpus);
	rowOpus != '' && searchSource(rowOpus);
	rowOpus != '' && Search.opus(rowOpus);
	rowTitle != '' && Search.translate(rowTitle);
	rowActress != '' && Rest.Actress.findByLocalname(rowActress, function(actressList) {
		console.log('findByLocalname', rowActress, actressList.length);
		$("#newActressLocal").val(rowActress);
		if (actressList.length == 0) {
			Search.actress(rowActress);
		} else if (actressList.length == 1) {
			$("#actress").val(actressList[0].name).effect("highlight", {}, 1000);
			$("#newActressFavorite").prop("checked", actressList[0].favorite);
			$("#newActressName"  ).val(actressList[0].name);
			$("#newActressBirth" ).val(actressList[0].birth);
			$("#newActressBody"  ).val(actressList[0].body);
			$("#newActressHeight").val(actressList[0].height);
			$("#newActressDebut" ).val(actressList[0].debut);
		} else {
			Search.actress(rowActress);
			$("#actressChoice > ul").empty();
			$.each(actressList, function(idx, actress) {
				$("<li>").append(
						$("<label>", {'class': 'text hover'}).html(actress.name + ' ' + actress.localName + ' ' + actress.birth + ' ' + actress.body + ' ' + actress.height + ' ' + actress.debut)
				).on("click", function() {
					console.log('actress choice', actress);
					$("#actress").val(actress.name);
					$("#actressChoice").dialog("close");
				}).appendTo($("#actressChoice > ul"));
			});
			$("#actressChoice").dialog({
				width: 600
			});
		}
	});;
});

// btn event
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
$(".btn-find-random-opus").on("click", function() {
	Search.opusByRandom();
});
$("#btn-video-close").on("click", function() {
	$("#resultVideoDiv").collapse('hide');
});
$("#btn-history-close").on("click", function() {
	$("#resultHistoryDiv").collapse('hide');
});

if (isAdmin) {
	$(".btn-reload").on("click", function() {
		Rest.Batch.reload();
	});
	$(".btn-download-page-image").on("click", function() {
		Picture.download($("#downloadPageImageForm").serialize(), function(result) {
		    $("#notice > p").empty().append(
					$("<ul>", {'class': 'list-unstyled'}).append(
							$("<li>", {'class': 'text-info'}).html(result.images.length + " images"),		
							$("<li>", {'class': 'text-primary'}).append(
									$("<span>", {'class': 'btn-link pointer'}).on("click", function() {
										Action.openFolder(result.localPath);
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
	$(".btn-batch-start").on("click", function() {
		var type  = $(this).data("type");
		var title = $(this).text();
		Rest.Batch.start(type, title);
	});
	$(".btn-batch-option").on("click", function() {
		var $this = $(this);
		var type  = $this.data("type");
		Rest.Batch.setOption(type, function(result) {
			$this.text(result).toggleClass("text-primary", result);
		});
	});
	$(".btn-get-candidates").on("click", function() {
		Rest.Flay.findCandidates(function(flayList) {
			var $candidatesList = $("#candidatesList").empty();
			$.each(flayList, function(idx, flay) {
				$("<div>", {'class': 'candidates list-group-item'}).append(
						$("<button>", {'class': 'btn btn-sm btn-block btn-warning'}).append(
								$("<strong>").html('Acept'),
								$("<span>", {'class': 'badge badge-light mr-1 ml-1'}).html(flay.files.candidate.length),
								' ' + flay.files.candidate.toString().replace(/,/gi, '<br>').replace(/\\/gi, '/').replace(/\//gi, '<b class="text-white"> / </b>')
						).on("click", function() {
							var $self = $(this);
							Rest.Flay.acceptCandidates(flay, function() {
								$self.hide();
							});
						}),
						$("<label>", {'class': 'text'}).html(flay.studio),
						$("<label>", {'class': 'text hover'}).html(flay.opus).on("click", function() {
							View.flay(flay.opus);
						}),
						$("<label>", {'class': 'text'}).html(flay.title),
						$("<label>", {'class': 'text'}).html(flay.actressList.toString()),
						$("<label>", {'class': 'text'}).html(flay.release),
						$("<img>", {'src': '/static/cover/' + flay.opus, 'class': 'img-thumbnail m-auto'}),
				).appendTo($candidatesList);
			});
		});
	});

	$("#downloadDir").val(LocalStorageItem.get("DOWNLOAD_LOCAL_PATH", ""));

	Rest.Batch.getOption('W', function(val) {
		$(".btn-batch-option[data-type='W']").html('' + val).toggleClass("text-primary", val);
	});
	Rest.Batch.getOption('R', function(val) {
		$(".btn-batch-option[data-type='R']").html('' + val).toggleClass("text-primary", val);
	});
	Rest.Batch.getOption('S', function(val) {
		$(".btn-batch-option[data-type='S']").html('' + val).toggleClass("text-primary", val);
	});

} else {
	$("[aria-role='ADMIN']").empty().hide();
}
