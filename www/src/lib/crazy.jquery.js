import jquery from 'jquery';

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
    case 1004 : // mouseup : prev   click
    case 1005 : // mouseup : next   click
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
    case   96 : // keyup : keypad 0
    case   97 : // keyup : keypad 1
    case   98 : // keyup : keypad 2
    case   99 : // keyup : keypad 3
    case  100 : // keyup : keypad 4
    case  101 : // keyup : keypad 5
    case  102 : // keyup : keypad 6
    case  103 : // keyup : keypad 7
    case  104 : // keyup : keypad 8
    case  105 : // keyup : keypad 9
    case  106 : // keyup : keypad *
    case  107 : // keyup : keypad +
    case  109 : // keyup : keypad -
    case  110 : // keyup : keypad .
    case  111 : // keyup : keypad /
   */
  $.fn.navEvent = function (callback) {
    const detectEvent = (e, callbackFunction) => {
      console.debug(`detectEvent target=${e.target.tagName} type=${e.type} key=${e.key} keyCode=${e.keyCode} which=${e.which} delta=${e.originalEvent.wheelDelta} ctrl=${e.ctrlKey} alt=${e.altKey} shift=${e.shiftKey}`);
      e.preventDefault();
      e.stopPropagation();
      callbackFunction(obtainSignal(e), e);
    };

    const obtainSignal = (e) => {
      switch (e.type) {
        case 'wheel':
          return e.originalEvent.wheelDelta < 0 ? -1 : 1;
        case 'mouseup':
          return e.which + 1000;
        case 'keyup':
          return e.keyCode;
        default:
          return 0;
      }
    };

    return this.each(function () {
      let $self = $(this);
      let $document = $(document);

      $self.data('active', true);
      $document.data('active', true);

      $self.off('wheel mouseup');
      $self.on('wheel mouseup', function (e) {
        if ($self.data('active')) detectEvent(e, callback);
      });

      $document.off('keyup');
      $document.on('keyup', function (e) {
        if ($document.data('active')) detectEvent(e, callback);
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

  $.extend($.expr.pseudos, {
    /** function containsIgnorecase */
    containsIgnorecase: function (elem, i, match, array) {
      return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || '').toLowerCase()) >= 0;
    },
  });
})(jquery);
