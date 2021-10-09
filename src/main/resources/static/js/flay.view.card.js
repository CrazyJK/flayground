/**
 * Flay Card view
 */

const STUDIO = 'studio', ACTRESS = 'actress', ACTRESS_EXTRA = 'actressExtra', MODIFIED = 'modified', COMMENT = 'comment', ACTION = 'action', RANK = 'rank', FILEINFO = 'fileinfo', BASKET = "basket";

(function($) {

	$.fn.appendFlayCard = function(flay, args) {
		var DEFAULTS = {
				width: 800,
				exclude: [],
				fontSize: '100%',
				archive: flay.archive,
				class: '',
				css: {}
		};
		var settings = $.extend({}, DEFAULTS, args);
		//console.log('$.fn.appendFlayCard', flay, settings);

		var templateFlay = ''
			+	'<div class="flay-card">'
			+		'<dl class="flay-card-body">'
			+			'<dt class="flay-card-title"><label class="text lg nowrap flay-title hover">Title</label></dt>'
			+			'<dd class="flay-card-text flay-rank-wrapper"></dd>'
			+			'<dd class="flay-card-text"><label class="text flay-studio">Studio</label></dd>'
			+			'<dd class="flay-card-text">'
			+				'<label class="text flay-opus">Opus</label>'
			+				'<label class="text flay-opus-search hover"><i class="fa fa-image"></i></label>'
            +				'<label class="text add-basket-btn hover"><i class="fa fa-shopping-cart"></i></label>'
			+				'<label class="text flay-rank-sm">Rank</label>'
			+			'</dd>'
			+			'<dd class="flay-card-text flay-actress-wrapper nowrap"></dd>'
			+			'<dd class="flay-card-text"><label class="text flay-release">Release</label></dd>'
			+			'<dd class="flay-card-text"><label class="text flay-modified">LastModified</label></dd>'
			+			'<dd class="flay-card-text flay-action-wrapper">'
			+				'<label class="text hover flay-movie">Movie</label> '
			+				'<label class="text hover flay-subtitles">sub</label> '
			+				'<label class="text hover flay-file-info-btn" data-toggle="collapse" data-target=".flay-file-group"><i class="fa fa-folder-open"></i></label>'
			+			'</dd>'
			+			'<dd class="flay-card-text flay-comment-wrapper"><label class="text flay-comment hover">Comment</label><input class="flay-comment-input" placeholder="Comment"/></dd>'
			+		'</dl>'
			+		'<ul class="list-group flay-file-group collapse">'
			+			'<li class="list-group-item flay-file">'
			+				'<div class="input-group input-group-sm">'
			+					'<input class="form-control border-dark flay-new-studio"  style="max-width: 100px;"/>'
			+					'<input class="form-control border-dark flay-new-opus" 	  style="max-width: 75px;" readonly="readonly"/>'
			+					'<input class="form-control border-dark flay-new-title"/>'
			+					'<input class="form-control border-dark flay-new-actress" style="max-width: 100px;"/>'
			+					'<input class="form-control border-dark flay-new-release" style="max-width: 90px;"/>'
			+					'<div class="input-group-append">'
			+						'<button class="btn btn-outline-dark btn-flay-rename">Rename</button>'
			+					'</div>'
			+				'</div>'
			+			'</li>'
			+		'</ul>'
			+	'</div>';

		var templateActress = ''
			+	'<div class="flay-actress">'
			+		'<label class="text flay-actress-favorite extra hover"><i class="fa fa-heart favorite"></i></label>'
			+		'<label class="text flay-actress-name hover">Asuka Kirara</label>'
			+		'<label class="text flay-actress-local  extra">明日花キララ</label>'
			+		'<label class="text flay-actress-birth  extra">1988年10月02日</label>'
			+		'<label class="text flay-actress-age    extra">31</label>'
			+		'<label class="text flay-actress-debut  extra">2007</label>'
			+		'<label class="text flay-actress-body   extra"></label>'
			+		'<label class="text flay-actress-height extra">165</label>'
			+	'</div>';

		var getRank = function(opus) {
			return 	'<span class="ranker flay-rank">'
				+		'<label><input type="radio" name="flay-rank-' + opus + '" value="-1"><i class="fa fa-thumbs-down r-1"></i></label>'
				+		'<label><input type="radio" name="flay-rank-' + opus + '" value="0"><i class="fa fa-circle r0"></i></label>'
				+		'<label><input type="radio" name="flay-rank-' + opus + '" value="1"><i class="fa fa-star r1"></i></label>'
				+		'<label><input type="radio" name="flay-rank-' + opus + '" value="2"><i class="fa fa-star r2"></i></label>'
				+		'<label><input type="radio" name="flay-rank-' + opus + '" value="3"><i class="fa fa-star r3"></i></label>'
				+		'<label><input type="radio" name="flay-rank-' + opus + '" value="4"><i class="fa fa-star r4"></i></label>'
				+		'<label><input type="radio" name="flay-rank-' + opus + '" value="5"><i class="fa fa-star r5"></i></label>'
				+	'</span>';
		};

		var getRankColor = function(rank) {
			if (rank < 0) {
				return '#00f';
			} else if (rank == 0) {
				return '#000';
			} else {
				return 'rgba(255, 0, 0, ' + rank*2/10 + ')';
			}
		};

		var constructFlay = function() {
			var $flayCard = $(templateFlay);

			// set data and event
			$flayCard.attr("id", flay.opus).data("flay", flay).addClass(settings.archive ? "archive" : "");
			// cover
			/*Rest.Cover.base64(flay.opus, function(resp) {
				$flayCard.find(".flay-card-body").css({
					backgroundImage: 'url(' + resp + ')'
				});
			});*/
			$flayCard.find(".flay-card-body").css({
				backgroundImage: 'url(/static/cover/' + flay.opus + ')'
			});
			// studio
			if (settings.exclude.includes(STUDIO)) {
				$flayCard.find(".flay-studio").remove();
			} else {
				$flayCard.find(".flay-studio").html(flay.studio).on("click", function() {
					View.studio(flay.studio);
				});
			}
			// opus
			$flayCard.find(".flay-opus").html(flay.opus).on("click", function() {
				View.video(flay.opus);
			});
			// opus search
			$flayCard.find(".flay-opus-search").on("click", function() {
				Search.opus(flay.opus);
			});
            // add-basket-btn
            if (settings.exclude.includes(BASKET)) {
                $flayCard.find(".add-basket-btn").remove();
            } else {
                $flayCard.find(".add-basket-btn").on("click", function () {
                    if (!flay.archive) {
                        flayWebsocket.info('{"mode":"grap", "opus":"' + flay.opus + '"}');
                    }
                });
            }
			// title
			$flayCard.find(".flay-title").html(flay.title).on("click", function() {
				View.flay(flay.opus);
			});
			// actress
			if (settings.exclude.includes(ACTRESS)) {
				$flayCard.find(".flay-actress-wrapper").remove();
			} else {
				constructActress($flayCard.find(".flay-actress-wrapper"));
			}
			// release
			$flayCard.find(".flay-release").html(flay.release);
			// modified
			if (settings.exclude.includes(MODIFIED)) {
				$flayCard.find(".flay-modified").remove();
			} else {
				$flayCard.find(".flay-modified").html(new Date(flay.lastModified).format("yyyy-MM-dd"));
			}
			// rank
			if (settings.exclude.includes(RANK)) {
				$flayCard.find(".flay-rank-wrapper").remove();
				if (flay.video.rank > 0)
					$flayCard.find(".flay-rank-sm").html(flay.video.rank).css({backgroundColor: getRankColor(flay.video.rank)});
				else
					$flayCard.find(".flay-rank-sm").remove();
			} else {
				if (settings.archive) {
					$flayCard.find(".flay-rank-wrapper").append(
							$("<label>", {class: "text text-danger hover"}).html("To Instance").on("click", function() {
								Rest.Archive.toInstance(flay.opus, function() {
									Rest.Batch.reload(function() {
										Rest.Video.get(flay.opus, function(video) {
											video.rank = 0;
											Rest.Video.update(video, function() {});
										});
									});
								});
							})
					);
				} else {
					$flayCard.find(".flay-rank-wrapper").append(getRank(flay.opus)).on("change", "input", function() {
						flay.video.rank = $(this).val();
						Rest.Video.update(flay.video, function() {
						});
					});
					$flayCard.find("input[name='flay-rank-" + flay.opus + "'][value='" + flay.video.rank + "']").prop("checked", true);
					$flayCard.find(".flay-rank-sm").remove();
				}
			}
			// action
			if (settings.exclude.includes(ACTION)) {
				$flayCard.find(".flay-action-wrapper").remove();
			} else {
				// movie
				var movieSize = flay.files.movie.length;
				$flayCard.find(".flay-movie").toggleClass("nonExist", movieSize == 0).html(
						movieSize == 0 ? 'noV ' :
							movieSize == 1 ? 'V ' + File.formatSize(flay.length) :
								movieSize + 'V ' + File.formatSize(flay.length)
				).on("click", function() {
					if (movieSize == 0)
						Search.torrent(flay.opus)
					else
						Rest.Flay.play(flay);
				});
				// subtitles
				$flayCard.find(".flay-subtitles").on("click", function() {
					if (flay.files.subtitles.length > 0) {
						Rest.Flay.subtitles(flay);
					} else {
						Search.subtitles(flay.opus);
					}
				}).addClass(flay.files.subtitles.length > 0 ? "" : "nonExist");
			}
			// files
			if (settings.exclude.includes(FILEINFO)) {
				$flayCard.find(".flay-file-info-btn").remove();
				$flayCard.find(".flay-file-group").remove();
			} else {
				var $flayFileGroup = $flayCard.find(".flay-file-group");
				$flayFileGroup.on('show.bs.collapse hidden.bs.collapse', function(e) {
					var height = e.type === 'show' ? $(this).height() : -$(this).height();
					window.resizeBy(0, height);
				});
				// cover file
				if (flay.files.cover.length > 0) {
					var $li = $("<li>", {'class': 'list-group-item flay-file'}).prependTo($flayFileGroup);
					$.each(flay.files.cover, function(idx, file) {
						$li.append(
								$("<div>", {'class': 'nowrap hover'}).html(file).on("click", function() {
									Rest.Flay.openFolder(file);
								})
						);
					});
				}
				// subtitles file
				if (flay.files.subtitles.length > 0) {
					var $li = $("<li>", {'class': 'list-group-item flay-file'}).prependTo($flayFileGroup);
					$.each(flay.files.subtitles, function(idx, file) {
						$li.append(
								$("<div>", {class: 'd-flex justify-content-between'}).append(
										$("<div>", {'class': 'nowrap hover'}).html(file).on("click", function() {
											Rest.Flay.openFolder(file);
										}),
										$("<div>", {class: 'ml-2', title: 'Delete this subtitles'}).append(
												$("<i>", {class: 'fa fa-times text-danger hover'})
										).on("click", function() {
											if (confirm('Will be delete ' + flay.opus + ' subtitles\n' + file)) {
												Rest.Flay.deleteFileOnFlay(flay.opus, file, function() {
													if (location.pathname === "/html/info/info.flay.html") {
														location.reload();
													}
												});
											}
										})
								)
						);
					});
				}
				// movie file
				if (flay.files.movie.length > 0) {
					var $li = $("<li>", {'class': 'list-group-item flay-file'}).prependTo($flayFileGroup);
					$.each(flay.files.movie, function(idx, file) {
						$li.append(
								$("<div>", {class: 'd-flex justify-content-between'}).append(
										$("<div>", {'class': 'nowrap hover'}).html(file).on("click", function() {
											Rest.Flay.openFolder(file);
										}),
										$("<div>", {class: 'ml-2', title: 'Detete this movie'}).append(
												$("<i>", {class: 'fa fa-times text-danger hover'})
										).on("click", function() {
											if (confirm('Will be delete ' + flay.opus + ' movie\n' + file)) {
												Rest.Flay.deleteFileOnFlay(flay.opus, file, function() {
													if (location.pathname === "/html/info/info.flay.html") {
														location.reload();
													}
												});
											}
										})
								)
						);
					});
				}
				// rename
				$flayCard.find(".flay-new-studio" ).val(flay.studio);
				$flayCard.find(".flay-new-opus"   ).val(flay.opus);
				$flayCard.find(".flay-new-title"  ).val(flay.title);
				$flayCard.find(".flay-new-actress").val(Util.Actress.getNames(flay.actressList));
				$flayCard.find(".flay-new-release").val(flay.release);
				$flayCard.find(".btn-flay-rename").on("click", function() {
					var newStudio  = $flayCard.find(".flay-new-studio").val();
					var newOpus    = $flayCard.find(".flay-new-opus").val();
					var newTitle   = $flayCard.find(".flay-new-title").val();
					var newActress = $flayCard.find(".flay-new-actress").val();
					var newRelease = $flayCard.find(".flay-new-release").val();
					var newFlay = {
							studio: newStudio,
							opus: flay.opus,
							title: newTitle,
							actressList: Util.Actress.toArray(newActress),
							release: newRelease
					};
					console.log("newFlay", newFlay);
					Rest.Flay.rename(flay.opus, newFlay, function() {
						location.reload();
					});
				});
			}
			// comment
			if (settings.exclude.includes(COMMENT)) {
				$flayCard.find(".flay-comment-wrapper").remove();
			} else {
				if (flay.video.comment != null && flay.video.comment != '') {
					$flayCard.find(".flay-comment").html(flay.video.comment);
					$flayCard.find(".flay-comment-input").val(flay.video.comment);
				} else {
					$flayCard.find(".flay-comment").addClass("nonExist");
				}
				$flayCard.find(".flay-comment").on("click", function() {
					$(this).hide();
					$flayCard.find(".flay-comment-input").show();
				});
				$flayCard.find(".flay-comment-input").on("keyup", function(e) {
					if (e.keyCode == 13) {
						var $self = $(this);
						flay.video.comment = $self.val();
						Rest.Video.update(flay.video, function() {
							$self.hide();
							$flayCard.find(".flay-comment").html(flay.video.comment).show();
						});
					}
				});
			}

			// set css
			$flayCard.css({
				fontSize: settings.fontSize,
				width: settings.width,
				aspectRatio: COVER_ASPECT_RATIO
			});
            if (settings.class != '') {
                $flayCard.addClass(settings.class);
            }
            if (Object.keys(settings.css).length > 0) {
                $flayCard.css(settings.css);
            }

			return $flayCard;
		};

		var constructActress = function($wrapper) {
			var setFavorite = function($actress, actress) {
				if (actress.favorite)
					$actress.find(".flay-actress-favorite > i").addClass("fa-heart favorite").removeClass("fa-heart-o");
				else
					$actress.find(".flay-actress-favorite > i").addClass("fa-heart-o").removeClass("fa-heart favorite");
			};

			$.each(flay.actressList, function(idx, name) {
				if (name != "") {
					var $actress = $(templateActress);
					$actress.attr("data-actress", name);
					$actress.find(".flay-actress-name").html(name).on("click", function() {
						View.actress(name);
					});
					$actress.appendTo($wrapper);

					if (settings.exclude.includes(ACTRESS_EXTRA)) {
						$wrapper.find(".flay-actress .extra").hide();
						return;
					}

					Rest.Actress.get(name, function(actress) {
						setFavorite($actress, actress);
						$actress.find(".flay-actress-name"  ).html(actress.name);
						$actress.find(".flay-actress-local" ).html(actress.localName);
						$actress.find(".flay-actress-birth" ).html(actress.birth);
						$actress.find(".flay-actress-age"   ).html(Util.Actress.getAge(actress));
						$actress.find(".flay-actress-debut" ).html(actress.debut.ifNotZero());
						$actress.find(".flay-actress-body"  ).html(actress.body);
						$actress.find(".flay-actress-height").html(actress.height.ifNotZero());

						$actress.find(".flay-actress-favorite > i").on("click", function() {
							actress.favorite = !actress.favorite;
							Rest.Actress.update(actress, function() {
								setFavorite($actress, actress);
							});
						});
					});
				}
			});
		};

		return this.each(function() {
			$(this).append(constructFlay());
		});

	};

}(jQuery));