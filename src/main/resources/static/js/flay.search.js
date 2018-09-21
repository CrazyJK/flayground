/**
 * Flay Search
 */

$("#query, #opus").on("keyup", function(e) {
	if (e.keyCode != 13) {
		return;
	}

	var keyword = $(this).val();
    var rexp = eval('/' + keyword + '/gi');

	// find video
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
							$("<label>", {"class": "text sm"}).html("V" + flay.files.movie.length),
							$("<label>", {"class": "text sm"}).html("S" + flay.files.subtitles.length),
							$("<label>", {"class": "text sm"}).html("R" + flay.video.rank),
							$("<label>", {"class": "text sm"}).html(File.formatSize(flay.length))
					).css({minWidth: 160}),
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
		$("#studio").val(studio.name);
	});

});

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
	
	$("#opus").val(opus).trigger("keyup");
	Search.opus(opus);
	Search.translate(title);
	name != '' && Search.actress(name);
	
	console.log(opus, braceIndex, title, minusIndex, name);
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
$(".btn-reload").on("click", function() {
	Rest.Batch.reload();
});
$(".btn-save-cover").on("click", function() {
	var opus = $("#opus").val();
	var title = $("#fullname").val();
	Cover.save(opus, title, function(result) {
		// TODO
	});
});
$(".btn-find-random-opus").on("click", function() {
	Search.opusByRandom();
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
		$this.text(result);
	});
});
$(".btn-get-candidates").on("click", function() {
	Rest.Flay.findCandidates(function(flayList) {
		var $candidatesList = $("#candidatesList").empty();
		$.each(flayList, function(idx, flay) {
			$("<div>").append(
					$("<label>", {'class': 'text'}).html(flay.studio),
					$("<label>", {'class': 'text'}).html(flay.opus).on("click", function() {
						View.flay(flay.opus);
					}),
					$("<label>", {'class': 'text'}).html(flay.title),
					$("<label>", {'class': 'text'}).html(flay.actressList.toString()),
					$("<label>", {'class': 'text'}).html(flay.release),
					$("<button>", {'class': 'btn btn-sm btn-block btn-warning nowrap'}).append(
							'Acept ',
							$("<span>", {'class': 'badge badge-light'}).html(flay.files.candidate.length),
							' ' + flay.files.candidate.toString().replace(/,/gi, '<br>')
					).on("click", function() {
						var $self = $(this);
						Rest.Flay.acceptCandidates(flay, function() {
							$self.hide();
						});
					})
			).appendTo($candidatesList);
		});
	});
});

Rest.Batch.getOption('W', function(val) {
	$(".btn-batch-option[data-type='W']").html('' + val);
});
Rest.Batch.getOption('R', function(val) {
	$(".btn-batch-option[data-type='R']").html('' + val);
});
Rest.Batch.getOption('S', function(val) {
	$(".btn-batch-option[data-type='S']").html('' + val);
});

$("#downloadDir").val(LocalStorageItem.get("DOWNLOAD_LOCAL_PATH", ""));

