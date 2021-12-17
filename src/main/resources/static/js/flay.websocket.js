/**
 * flaygound websocket
 * ref. http://jmesnil.net/stomp-websocket/doc/
 */

var flayWebsocket = (function ($) {
	var debug = false;

	var STOMP_ENDPOINT = '/flayground-websocket';

	var TOPIC = '/topic',
		QUEUE = '/queue';

	var TOPIC_ANNOUNCE = TOPIC + '/announce';
	var TOPIC_SAY = TOPIC + '/say';
	var QUEUE_INFO = QUEUE + '/info';

	var ANNOUNCE = 'ANNOUNCE',
		ANNOUNCE_TO = 'ANNOUNCE_TO',
		SAY = 'SAY',
		SAY_TO = 'SAY_TO',
		INFO = 'INFO';

	var stompClient = null;

	var switchSelector = '#notification';

	$('head').append('<script type="text/javascript" src="/webjars/sockjs-client/sockjs.min.js"></script>', '<script type="text/javascript" src="/webjars/stomp-websocket/stomp.min.js"></script>');

	// $.getScript("/webjars/sockjs-client/sockjs.min.js");
	// $.getScript("/webjars/stomp-websocket/stomp.min.js");

	var isAdmin, username;

	$(document).ready(function () {
		isAdmin = Security.hasRole('ADMIN');
		username = Security.getName();

		var $websocketSwitch = $(switchSelector);
		if ($websocketSwitch.length > 0) {
			$websocketSwitch.on('change', function () {
				$(this).prop('checked') ? connect() : disconnect();
			});

			if ($websocketSwitch.prop('checked')) connect();
		} else {
			if (debug) console.log('flayWebsocket', 'switch is not exist. will be connected automatically');
			connect();
		}
	});

	window.onunload = disconnect;

	var connect = function () {
		var socket = new SockJS(STOMP_ENDPOINT);
		stompClient = Stomp.over(socket);

		// or
		// stompClient = Stomp.client(STOMP_ENDPOINT);

		stompClient.connect(
			{},
			function (frame) {
				if (debug) console.log('flayWebsocket', 'connected', username);

				showMessage(ANNOUNCE, frame);

				stompClient.subscribe(TOPIC_ANNOUNCE, function (message) {
					showMessage(ANNOUNCE, message);
				});

				stompClient.subscribe('/user' + TOPIC_ANNOUNCE, function (message) {
					showMessage(ANNOUNCE_TO, message);
				});

				stompClient.subscribe(TOPIC_SAY, function (message) {
					showMessage(SAY, message);
				});

				stompClient.subscribe('/user' + TOPIC_SAY, function (message) {
					showMessage(SAY_TO, message);
				});

				stompClient.subscribe('/user' + QUEUE_INFO, function (message) {
					infoCallback(message);
				});
			},
			function (frame) {
				showMessage(ANNOUNCE, frame);
			},
		);

		stompClient.debug = function (str) {
			if (debug) console.log('stomp debug', str);
		};
	};

	var disconnect = function () {
		if (stompClient !== null) {
			stompClient.disconnect(function () {
				if (debug) console.log('flayWebsocket', 'disconnected');
				showMessage(ANNOUNCE, { command: 'DISCONNECTED' });
				// re-connect
				connect();
			});
		}
	};

	var say = function (message, to) {
		if (!username) {
			alert('User info is not exist!!!');
			return;
		}
		var dest = '/flayground/say';
		if (to) {
			dest = dest + 'To'; // + "/user/" + to;
		}
		stompClient.send(
			dest,
			{
				to: to,
			},
			JSON.stringify({
				name: username,
				content: message,
			}),
		);
	};

	var info = function (payLoad) {
		stompClient.send(
			'/flayground/info',
			{},
			JSON.stringify({
				name: username,
				content: payLoad,
			}),
		);
	};

	var showMessage = function (type, message) {
		if (debug) console.log(message);
		if (opener) {
			return;
		}
		var title,
			content,
			time = new Date();
		if (message.command === 'CONNECTED') {
			title = 'Connected';
			content = 'signed in ' + message.headers['user-name'];
		} else if (message.command === 'DISCONNECTED') {
			title = 'Disconnected';
			content = '';
		} else if (message.command === 'MESSAGE') {
			var body = JSON.parse(message.body);
			title = body.title;
			content = body.content;
			time.setTime(body.time);
		} else {
			title = "<span class='text-danger'>" + ANNOUNCE + '</span>';
			content = message;
		}
		content = content.trim().replace(/\n/g, '<br>');
		if (debug) console.log('websocket', type, title, content);

		// if wrapper not exist, insert
		var wrapper = 'announceWrapper';
		if ($('#' + wrapper).length === 0) {
			$('body > footer').append(
				$('<div>', { id: wrapper }).css({
					position: 'fixed',
					right: 0,
					zIndex: 69,
				}),
			);
		}
		var bottomHeight = $('.fixed-bottom').length === 0 || $('.fixed-bottom').css('display') === 'none' ? 0 : $('.fixed-bottom').height() + 16;
		$('#' + wrapper).css({
			bottom: bottomHeight,
		});

		var showBox = function (_box) {
			_box.show('blind', { direction: 'right' });
		};
		var hideBox = function (_box) {
			_box.hide('slide', { direction: 'right' }, function () {
				$(this).remove();
			});
		};

		var $box = $('<div>', { class: 'text-light bg-black rounded m-2 p-2' })
			.css({
				border: '1px solid #ddd',
				boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, .125)',
				display: 'none',
				width: 250,
			})
			.append(
				$('<i>', { class: 'fa fa-bell float-left' }),
				$('<i>', { class: 'fa fa-times float-right hover' }).on('click', function () {
					hideBox($(this).parent());
				}),
				$('<small>', { class: 'float-right mr-2' }).html(time.format('a/p hh:mm')),
				$('<div>', { class: 'ml-4' }).append(
					$('<h6>', { class: 'font-weight-bold m-0' }).append(type === SAY || type === SAY_TO ? "<span class='text-primary'>From</span> " : '', title),
					$('<div>', { class: 'mt-2' })
						.css({
							fontSize: '.875rem',
						})
						.append(content),
				),
			)
			.appendTo($('#' + wrapper));
		showBox($box);

		setTimeout(function () {
			hideBox($box);
		}, 5 * 1000);
	};

	var infoCallback = function (message) {
		var messageBody = JSON.parse(message.body);
		if (debug) console.log('infoCallback', messageBody.content);
		if (messageBody.content === 'bgtheme') {
			// adjust theme
			try {
				adjustTheme();
			} catch (ignored) {}
		} else if (messageBody.content === 'bgcolor') {
			var bgColor = LocalStorageItem.get('flay.bgcolor', '#000000');
			$('body').css({ backgroundColor: bgColor });
		} else {
			var content = JSON.parse(messageBody.content.replace(/&quot;/g, '"'));
			console.log('content', content);
			if (content.mode === 'grap') {
				if (typeof grapFlay !== 'undefined') {
					grapFlay(content.opus);
				}
			} else {
				console.log('unknown code');
			}
		}
	};

	return {
		say: say,
		info: info,
		stop: disconnect,
	};
})(jQuery);
