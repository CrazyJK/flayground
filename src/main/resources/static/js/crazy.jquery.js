;
(function($) {

	$.fn.navEvent = function(callback) {
		/**
		 * detect event signal 
		 * @returns 
			case    1 : // mousewheel : up
			case   -1 : // mousewheel : down
			case 1001 : // mousedown  : left click
			case 1002 : // mousedown  : middle click
			case 1003 : // mousedown  : right click
			case   13 : // key : enter
			case   32 : // key : space
			case   33 : // key : PageUp
			case   34 : // key : PageDown
			case   36 : // key : home
			case   37 : // key : left
			case   38 : // key : up
			case   39 : // key : right
			case   40 : // key : down
			case   45 : // key : Insert
			case   46 : // key : delete
			case   83 : // key : 's'
			case   97 : // key : keypad 1
			case   98 : // key : keypad 2 
			case   99 : // key : keypad 3
			case  100 : // key : keypad 4 
			case  101 : // key : keypad 5 
			case  102 : // key : keypad 6 
			case  103 : // key : keypad 7 
			case  104 : // key : keypad 8 
			case  105 : // key : keypad 9 
		 */
		var detectEvent = function(e, method) {
			method(
				(e.type === 'mousewheel' || e.type === 'DOMMouseScroll') ? mousewheel(e) :
					(e.type === 'keyup') ? e.keyCode :
						(e.type === 'mouseup' || e.type === 'mousedown') ? e.which + 1000 :
							(e.type === 'contextmenu') ? 1003 : 0
			, e);
			e.stopPropagation();
		};
		var mousewheel = function(event) {
			return browser == MSIE || browser == CHROME ? event.originalEvent.wheelDelta / 120 :
				browser == SAFARI ? event.originalEvent.wheelDelta / -12 :
					browser == FIREFOX ? event.originalEvent.detail / -3 : 0;
		};

		return this.each(function() {
			var self = $(this);
			self.off();
			self.data("active", true);
			$(window).data("active", true);
			self.on("mousewheel DOMMouseScroll mouseup", function(e) {
				$(this).data("active") && detectEvent(e, callback);
			});
			browser === FIREFOX && self.on("contextmenu", function(e) {
				$(this).data("active") && detectEvent(e, callback);
			});
			$(window).on("keyup", function(e) {
				$(this).data("active") && detectEvent(e, callback);
			});
		});
	};
	
	$.fn.navActive = function(active) {
		return this.each(function() {
			$(this).data("active", active);
			$(window).data("active", active);
		});
	};
	
}(jQuery));
