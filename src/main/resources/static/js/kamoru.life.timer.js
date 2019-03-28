/**
 * life timer
 */
;
var STARTING = new Date(1976, 3, 28), DEADLINE = new Date(2031, 3, 28);

(function($) {

	$.fn.lifeTimer = function(options) {
		
		var opts = $.extend({}, {
			classes: '',
			mode: 'remain',
			pattern: 'dayd hh:mm:ss',
			progress: true,
			onlyOnce: false
		}, options);
		
		var HTML = ''
			+ '<div id="life-timer" style="display: none;">'
			+   '<div class="progress" style="height: .25rem;">'
			+     '<div class="progress-bar" style="width: 0%; transition: width 6s ease;"></div>'
			+   '</div>'
			+   '<div class="display-time" style="padding: 0 .5rem;"></div>'
			+ '</div>';

		var SECOND = 1000,
	        MINUTE = SECOND * 60, // 1000 * 60
	        HOUR   = MINUTE * 60, // 1000 * 60 * 60
	        DAY    = HOUR   * 24, // 1000 * 60 * 60 * 24
	        startingTime = STARTING.getTime(),
	        deadlineTime = DEADLINE.getTime();
		
		var startTimer = function() {
		    var $lifeTimer   = $("#life-timer");
		    var $progress    = $("#life-timer .progress");
		    var $progressbar = $("#life-timer .progress-bar");
		    var $displayTime = $("#life-timer .display-time");
 		    
			if (!opts.progress)
				$progress.hide();
			else if (opts.progress === 'bottom')
				$progress.insertAfter("#life-timer .display-time");

		    // life remaining display timer
			var first = true, timer;
			var fnTimer = function() {
		        var pad = function(x) {
		        	return x < 10 ? "0" + x : x;
		        };
		        var now = new Date().getTime(),
			        timeEntire    = deadlineTime - startingTime,
		        	timePast      = now - startingTime,
		        	timeRemaining = deadlineTime - now,
		        	
		        	entireDay  = Math.floor(timeEntire / DAY),
		        	
		        	pastDay    = Math.floor(timePast / DAY),
		        	pastHour   = Math.floor(timePast % DAY / HOUR),
		        	pastMinute = Math.floor(timePast % HOUR / MINUTE),
		        	pastSecond = Math.floor(timePast % MINUTE / SECOND);

		        	remainDay    = Math.floor(timeRemaining / DAY),
		        	remainHour   = Math.floor(timeRemaining % DAY / HOUR),
		        	remainMinute = Math.floor(timeRemaining % HOUR / MINUTE),
		        	remainSecond = Math.floor(timeRemaining % MINUTE / SECOND);

		        if (timeRemaining < 0) {
		            clearInterval(timer);
		            $displayTime.css({textShadow: '0 0 4px #f00'}).addClass("d-day").html("EXPIRED!!!");
		            return;
		        }

				if (first) {
					$lifeTimer.addClass(opts.classes).fadeIn();
					first = false;
				}
				
				$progressbar.css({
					"width": Math.round(timePast / timeEntire * 100) + '%'
				});

				$displayTime.html(opts.pattern.replace(/(day|hh|mm|ss)/g, function($1) {
					switch ($1) {
					case 'day':
						return opts.mode === 'remain' ? remainDay.withComma(): pastDay.withComma();
					case 'hh':
						return pad(opts.mode === 'remain' ? remainHour : pastHour);
					case 'mm':
						return pad(opts.mode === 'remain' ? remainMinute : pastMinute);
					case 'ss':
						return pad(opts.mode === 'remain' ? remainSecond : pastSecond);
					}
				}));

		    };
		    if (opts.onlyOnce)
		    	fnTimer();
		    else
		    	timer = setInterval(fnTimer, 1000);
		};
		
		return this.each(function() {
			$(this).append(HTML);
			startTimer();
		});
	};
	
}(jQuery));
