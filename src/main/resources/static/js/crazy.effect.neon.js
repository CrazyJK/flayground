/**
 * neon effect
 */

(function ($) {
	$('head').append('<link rel="stylesheet" href="/css/crazy.neon.css">');

	$.fn.neonBorder = function (onOff, no) {
		return this.each(function () {
			var $self = $(this);
			if (onOff) {
				$self.addClass('blink-border-' + (no ? no : Random.getInteger(1, 5)));
			} else {
				$self.removeClass('blink-border-1 blink-border-2 blink-border-3 blink-border-4 blink-border-5');
			}
		});
	};

	$.fn.neon = function (onOff, no) {
		return this.each(function () {
			var $self = $(this);
			if (onOff) {
				$self.addClass('blink blink-' + (no ? no : Random.getInteger(1, 10)));
			} else {
				$self.removeClass('blink blink-1 blink-2 blink-3 blink-4 blink-5 blink-6 blink-7 blink-8 blink-9 blink-10');
			}
		});
	};

	$.fn.neonLoading = function (onOff, no) {
		return this.each(function () {
			var $self = $(this);
			if (onOff) {
				$self.addClass('blink-loading-' + (no ?? Random.getInteger(1, 5)));
			} else {
				$self.removeClass('blink-loading-1 blink-loading-2 blink-loading-3 blink-loading-4 blink-loading-5');
			}
		});
	};
})(jQuery);
