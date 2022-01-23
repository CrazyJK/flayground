(function ($) {
	/**
	 * navigation event listener
	 *
	 * callback argument is detected event signal
		case    0 : // unknown event
		case    1 : // wheel : up
		case   -1 : // wheel : down
		case 1001 : // mouseup : left   click
		case 1002 : // mouseup : middle click
		case 1003 : // mouseup : right  click
		case   13 : // keyup : enter
		case   32 : // keyup : space
		case   33 : // keyup : PageUp
		case   34 : // keyup : PageDown
		case   36 : // keyup : home
		case   37 : // keyup : left
		case   38 : // keyup : up
		case   39 : // keyup : right
		case   40 : // keyup : down
		case   45 : // keyup : Insert
		case   46 : // keyup : delete
		case   83 : // keyup : 's'
		case   97 : // keyup : keypad 1
		case   98 : // keyup : keypad 2
		case   99 : // keyup : keypad 3
		case  100 : // keyup : keypad 4
		case  101 : // keyup : keypad 5
		case  102 : // keyup : keypad 6
		case  103 : // keyup : keypad 7
		case  104 : // keyup : keypad 8
		case  105 : // keyup : keypad 9
	 */
	$.fn.navEvent = function (callback) {
		var detectEvent = function (e, callbackFunction) {
			e.stopPropagation();
			callbackFunction(obtainSignal(e), e);
		};

		var obtainSignal = function (e) {
			let signal;
			switch (e.type) {
				case 'wheel':
					signal = e.originalEvent.wheelDelta < 0 ? -1 : 1;
					break;
				case 'mouseup':
					signal = e.which + 1000;
					break;
				case 'keyup':
					signal = e.keyCode;
					break;
				default:
					signal = 0;
			}
			return signal;
		};

		return this.each(function () {
			let $self = $(this);
			let $document = $(document);

			$self.data('active', true);
			$document.data('active', true);

			$self.off('wheel mouseup');
			$self.on('wheel mouseup', function (e) {
				$self.data('active') && detectEvent(e, callback);
			});

			$document.off('keyup');
			$document.on('keyup', function (e) {
				$document.data('active') && detectEvent(e, callback);
			});
		});
	};

	/**
	 * navigation event on/off
	 *
	 * @param {boolean} active
	 * @returns
	 */
	$.fn.navActive = function (active) {
		return this.each(function () {
			$(this).data('active', active);
			$(document).data('active', active);
		});
	};

	/**
	 * function containsIgnorecase
	 */
	$.extend($.expr[':'], {
		containsIgnorecase: function (elem, i, match, array) {
			return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || '').toLowerCase()) >= 0;
		},
	});
})(jQuery);
