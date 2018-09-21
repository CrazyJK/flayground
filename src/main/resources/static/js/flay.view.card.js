/**
 * Flay Card view
 */

const STUDIO = 'studio', ACTRESS = 'actress', ACTRESS_EXTRA = 'actressExtra', MODIFIED = 'modified', COMMENT = 'comment', ACTION = 'action', RANK = 'rank';

(function($) {
	
	$.fn.appendFlayCard = function(flay, args) {
		var DEFAULTS = {
				width: 800,
				exclude: [],
				fontSize: '100%'
		};
		var settings = $.extend({}, DEFAULTS, args);
		
		console.log('$.fn.appendFlayCard', flay, settings);
		
		var templateFlay = ''
			+	'<div class="card flay-card">'
			+		'<div class="card-body">'
			+			'<p class="card-title"><label class="text lg nowrap flay-title hover">Title</label></p>'
			+			'<p class="card-text flay-rank-wrapper"></p>'
			+			'<p class="card-text"><label class="text flay-studio">Studio</label></p>'
			+			'<p class="card-text"><label class="text flay-opus">Opus</label></p>'
			+			'<p class="card-text flay-actress-wrapper nowrap"></p>'
			+			'<p class="card-text"><label class="text flay-release">Release</label></p>'
			+			'<p class="card-text"><label class="text flay-modified">LastModified</label></p>'
			+			'<p class="card-text flay-action-wrapper">'
			+				'<label class="text hover flay-movie">Movie</label> '
			+				'<label class="text hover flay-subtitles">Subtitles</label> '
			+				'<label class="text hover flay-file-info-btn" data-toggle="collapse" data-target=".flay-file-group"><i class="fa fa-folder-open"></i></label>'
			+			'</p>'
			+			'<p class="card-text flay-comment-wrapper"><label class="text flay-comment hover">Comment</label><input class="flay-comment-input" placeholder="Comment"/></p>'
			+			'<ul class="list-group flay-file-group collapse">'
			+				'<li class="list-group-item border-dark flay-file">'
			+					'<div class="input-group input-group-sm">'
			+						'<input class="form-control border-dark flay-new-studio"  style="max-width: 100px;"/>'
			+						'<input class="form-control border-dark flay-new-opus" 	  style="max-width: 75px;" readonly="readonly"/>'
			+						'<input class="form-control border-dark flay-new-title"/>'
			+						'<input class="form-control border-dark flay-new-actress" style="max-width: 100px;"/>'
			+						'<input class="form-control border-dark flay-new-release" style="max-width: 90px;"/>'
			+						'<div class="input-group-append">'
			+							'<button class="btn btn-outline-dark btn-flay-rename">Rename</button>'
			+						'</div>'
			+					'</div>'
			+				'</li>'
			+			'</ul>' 
			+		'</div>'
			+	'</div>';
		var templateActress = ''
			+	'<div class="flay-actress">'
			+		'<label class="text flay-actress-favorite extra hover"><i class="fa fa-star favorite"></i></label>'
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
		
		var constructFlay = function() {
			var $flayCard = $(templateFlay);
			
			// set data and event
			$flayCard.attr("id", flay.opus).data("flay", flay);
			$flayCard.find(".card-body").css({
				backgroundImage: 'url(/static/cover/' + flay.opus + ')'
			});
			
			$flayCard.find(".flay-studio").html(flay.studio);
			$flayCard.find(".flay-opus").html(flay.opus);
			$flayCard.find(".flay-title").html(flay.title).on("click", function() {
				View.flay(flay.opus);
			});
			constructActress($flayCard.find(".flay-actress-wrapper"));
			$flayCard.find(".flay-release").html(flay.release);
			$flayCard.find(".flay-modified").html(new Date(flay.lastModified).format("yyyy-MM-dd"));
			
			$flayCard.find(".flay-rank-wrapper").append(getRank(flay.opus)).on("change", "input", function() {
				flay.video.rank = $(this).val();
				Rest.Video.update(flay.video, function() {
				});
			});
			$flayCard.find("input[name='flay-rank-" + flay.opus + "'][value='" + flay.video.rank + "']").prop("checked", true);
			var movieSize = flay.files.movie.length;
			$flayCard.find(".flay-movie").toggleClass("nonExist", movieSize == 0).html(
					movieSize == 0 ? '' : 
						movieSize == 1 ? 'V ' + File.formatSize(flay.length) :
							movieSize + 'V ' + File.formatSize(flay.length)
			).on("click", function() {
				console.log(flay);
				Rest.Flay.play(flay);
			});
			$flayCard.find(".flay-subtitles").toggle(flay.files.subtitles.length > 0).on("click", function() {
				Rest.Flay.subtitles(flay);
			});
			
			var $flayFileGroup = $flayCard.find(".flay-file-group");
			if (flay.files.cover.length > 0) {
				var $li = $("<li>", {'class': 'list-group-item border-dark flay-file'}).prependTo($flayFileGroup);
				$.each(flay.files.cover, function(idx, file) {
					$li.append(
							$("<div>", {'class': 'nowrap hover'}).html(file).on("click", function() {
								Rest.Flay.openFolder(file);
							})
					);
				});
			}
			if (flay.files.subtitles.length > 0) {
				var $li = $("<li>", {'class': 'list-group-item border-dark flay-file'}).prependTo($flayFileGroup);
				$.each(flay.files.subtitles, function(idx, file) {
					$li.append(
							$("<div>", {'class': 'nowrap hover'}).html(file).on("click", function() {
								Rest.Flay.openFolder(file);
							})
					);
				});
			}
			if (flay.files.movie.length > 0) {
				var $li = $("<li>", {'class': 'list-group-item border-dark flay-file'}).prependTo($flayFileGroup);
				$.each(flay.files.movie, function(idx, file) {
					$li.append(
							$("<div>", {'class': 'nowrap hover'}).html(file).on("click", function() {
								Rest.Flay.openFolder(file);
							})
					);
				});
			}
			
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

			// set css
			$flayCard.css({
				width: settings.width,
				height: parseInt(settings.width * COVER_RATIO),
				fontSize: settings.fontSize
			});
			$flayCard.find(".flay-title").css({
				maxWidth: settings.width - settings.width/20
			});
			
			// set exclude
			if (settings.exclude.length > 0) {
				if (settings.exclude.includes(ACTRESS))
					$flayCard.find(".flay-actress-wrapper").hide();
				if (settings.exclude.includes(MODIFIED))
					$flayCard.find(".flay-modified").hide();
				if (settings.exclude.includes(ACTION))
					$flayCard.find(".flay-action-wrapper").hide();
				if (settings.exclude.includes(COMMENT))
					$flayCard.find(".flay-comment-wrapper").hide();
				if (settings.exclude.includes(RANK))
					$flayCard.find(".flay-rank-wrapper").hide();
			}

			return $flayCard;
		};

		var constructActress = function($wrapper) {
			var setFavorite = function($actress, actress) {
				if (actress.favorite)
					$actress.find(".flay-actress-favorite > i").addClass("fa-star favorite").removeClass("fa-star-o");
				else 
					$actress.find(".flay-actress-favorite > i").addClass("fa-star-o").removeClass("fa-star favorite");
			};
			
			$.each(flay.actressList, function(idx, name) {
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
					$actress.find(".flay-actress-debut" ).html(actress.debut.toBlank());
					$actress.find(".flay-actress-body"  ).html(actress.body);
					$actress.find(".flay-actress-height").html(actress.height.toBlank());
					
					$actress.find(".flay-actress-favorite > i").on("click", function() {
						actress.favorite = !actress.favorite;
						Rest.Actress.update(actress, function() {
							setFavorite($actress, actress);
						});
					});

				});

			});
		};
		
		return this.each(function() {
			var $self = $(this);
			$self.append(constructFlay());
		});
		
	};

}(jQuery));