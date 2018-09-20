/**
 * Flay Card view
 */

const ACTRESS = 'actress', ACTRESS_EXTRA = 'actressExtra', MODIFIED = 'modified', COMMENT = 'comment', ACTION = 'action', RANK = 'rank';

(function($) {
	
	$.fn.appendFlayCard = function(flay, args) {
		var DEFAULTS = {
				width: 800,
				exclude: [],
				fontSize: '100%'
		};
		var settings = $.extend({}, DEFAULTS, args);
		
		
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
			+			'<p class="card-text flay-action-wrapper"><label class="text hover flay-movie">Movie</label> <label class="text hover flay-subtitles">Subtitles</label></p>'
			+			'<p class="card-text flay-comment-wrapper"><label class="text flay-comment">Comment</label><input class="flay-comment-input" placeholder="Comment"/></p>'
			+		'</div>'
			+	'</div>';
		var templateActress = ''
			+	'<div class="flay-actress">'
			+		'<label class="text flay-actress-favorite hover"><i class="fa fa-star favorite"></i></label>'
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
				var flayData = $("#" + flay.opus).data("flay");
				console.log($(this).val(), flay.opus);
				flayData.video.rank = $(this).val();
				Rest.Video.update(flayData.video, function() {
				});
			});
			$flayCard.find("input[name='flay-rank-" + flay.opus + "'][value='" + flay.video.rank + "']").prop("checked", true);
			var movieSize = flay.files.movie.length;
			$flayCard.find(".flay-movie").toggleClass("nonExist", movieSize == 0).html(
					movieSize == 0 ? '' : 
						movieSize == 1 ? 'V ' + File.formatSize(flay.length) :
							movieSize + 'V ' + File.formatSize(flay.length)
			).on("click", function() {
				
				var flayData = $("#" + flay.opus).data("flay");
				Rest.Flay.play(flayData);
			});
			$flayCard.find(".flay-subtitles").toggle(flay.files.subtitles.length > 0);
			if (flay.video.comment != '') {
				$flayCard.find(".flay-comment").html(flay.video.comment);
				$flayCard.find(".flay-comment-input").val(flay.video.comment);
			} else {
				$flayCard.find(".flay-comment").addClass("nonExist");
			}

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
			$.each(flay.actressList, function(idx, name) {
				var $actress = $(templateActress);
				$actress.attr("data-actress", name);
				$actress.find(".flay-actress-name").html(name);
				$actress.appendTo($wrapper);
				
				if (settings.exclude.includes(ACTRESS_EXTRA)) {
					$wrapper.find(".flay-actress .extra").hide();
					return;
				}
					
				Rest.Actress.get(name, function(actress) {
					if (actress.favorite)
						$actress.find(".flay-actress-favorite > i").addClass("fa-star favorite").removeClass("fa-star-o");
					else 
						$actress.find(".flay-actress-favorite > i").addClass("fa-star-o").removeClass("fa-star favorite");
					$actress.find(".flay-actress-name"  ).html(actress.name);
					$actress.find(".flay-actress-local" ).html(actress.localName);
					$actress.find(".flay-actress-birth" ).html(actress.birth);
					$actress.find(".flay-actress-age"   ).html(Util.Actress.getAge(actress));
					$actress.find(".flay-actress-debut" ).html(actress.debut.toBlank());
					$actress.find(".flay-actress-body"  ).html(actress.body);
					$actress.find(".flay-actress-height").html(actress.height.toBlank());
				});

			});
		};
		
		return this.each(function() {
			var $self = $(this);
			$self.append(constructFlay());
		});
		
	};

}(jQuery));