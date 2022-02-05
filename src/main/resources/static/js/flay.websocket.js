/**
 * flaygound websocket
 * ref. http://jmesnil.net/stomp-websocket/doc/
 */

var flayWebsocket = (function ($) {
	const STOMP_ENDPOINT = '/flayground-websocket';
	const TOPIC = '/topic';
	const QUEUE = '/queue';

	const TOPIC_ANNOUNCE = TOPIC + '/announce';
	const TOPIC_SAY = TOPIC + '/say';
	const QUEUE_INFO = QUEUE + '/info';

	const ANNOUNCE = 'ANNOUNCE';
	const ANNOUNCE_TO = 'ANNOUNCE_TO';
	const SAY = 'SAY';
	const SAY_TO = 'SAY_TO';
	const INFO = 'INFO';

	const switchSelector = '#notification';
	const wrapper = 'announceWrapper';

	let stompClient = null;
	let debugEnabled = false;
	let stompDebugEnabled = false;

	$('head').append('<script type="text/javascript" src="/webjars/sockjs-client/sockjs.min.js"></script>', '<script type="text/javascript" src="/webjars/stomp-websocket/stomp.min.js"></script>');

	const connect = () => {
		const socket = new SockJS(STOMP_ENDPOINT);
		stompClient = Stomp.over(socket);
		// or
		// stompClient = Stomp.client(STOMP_ENDPOINT);

		stompClient.connect(
			{},
			(frame) => {
				if (debugEnabled) {
					console.log('flayWebsocket', 'connected', username);
				}

				showMessage(ANNOUNCE, frame, '1st');

				stompClient.subscribe(TOPIC_ANNOUNCE, (message) => {
					showMessage(ANNOUNCE, message);
				});

				stompClient.subscribe('/user' + TOPIC_ANNOUNCE, (message) => {
					showMessage(ANNOUNCE_TO, message);
				});

				stompClient.subscribe(TOPIC_SAY, (message) => {
					showMessage(SAY, message);
				});

				stompClient.subscribe('/user' + TOPIC_SAY, (message) => {
					showMessage(SAY_TO, message);
				});

				stompClient.subscribe('/user' + QUEUE_INFO, (message) => {
					infoCallback(message);
				});
			},
			(frame) => {
				showMessage(ANNOUNCE, frame, '2nd');
			},
		);

		stompClient.debug = (str) => {
			if (stompDebugEnabled) {
				console.log('stomp debug', str);
			}
		};
	};

	const disconnect = () => {
		if (stompClient !== null) {
			stompClient.disconnect(() => {
				if (debugEnabled) {
					console.log('flayWebsocket', 'disconnected');
				}
				showMessage(ANNOUNCE, { command: 'DISCONNECTED' });
			});
		}
	};

	const showMessage = (type, message, from) => {
		if (debugEnabled) {
			console.log('showMessage input - ', type, message, from);
		}
		if (opener) {
			return;
		}

		let title,
			content,
			time = new Date();
		if (message.command === 'CONNECTED') {
			title = 'Connected';
			content = 'signed in ' + message.headers['user-name'];
		} else if (message.command === 'DISCONNECTED') {
			title = 'Disconnected';
			content = '';
		} else if (message.command === 'MESSAGE') {
			const body = JSON.parse(message.body);
			title = body.title;
			content = body.content;
			time.setTime(body.time);
		} else {
			title = "<span class='text-danger'>" + ANNOUNCE + '</span>';
			content = message;
			if (message.indexOf('Lost connection') > -1) {
				content = 'Lost connection! will be re-connected';
				setTimeout(() => {
					connect();
				}, 1000);
			}
		}
		content = content.trim().replace(/\n/g, '<br>');

		if (debugEnabled) {
			console.log(`showMessage parse - ${type} - ${title} - ${content}`);
		}

		const showBox = (_box) => {
			_box.show('blind', { direction: 'right' });
		};
		const hideBox = (_box) => {
			_box.hide('slide', { direction: 'right' }, function () {
				// $(this).remove();
			});
		};

		const $box = $('<div>', { class: 'text-light bg-black rounded m-2 p-2' })
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
		setTimeout(() => {
			hideBox($box);
		}, 5 * 1000);
	};

	const infoCallback = function (message) {
		const messageBody = JSON.parse(message.body);
		if (debugEnabled) {
			console.log('infoCallback', messageBody.content);
		}

		if (messageBody.content === 'bgtheme') {
			try {
				adjustTheme();
			} catch (ignored) {}
		} else if (messageBody.content === 'bgcolor') {
			const bgColor = LocalStorageItem.get('flay.bgcolor', '#000000');
			$('body').css({ backgroundColor: bgColor });
		} else {
			const content = JSON.parse(messageBody.content.replace(/&quot;/g, '"'));
			console.log('content', content);
			if (content.mode === 'grap') {
				if (typeof grapFlay !== 'undefined') {
					grapFlay(content.opus);
				}
			} else {
				console.log('unknown mode');
				alert('unknown info mode');
			}
		}
	};

	// add eventListener and connect
	let isAdmin, username;
	$(document).ready(function () {
		isAdmin = Security.hasRole('ADMIN');
		username = Security.getName();

		const $websocketSwitch = $(switchSelector);

		if ($websocketSwitch.length > 0) {
			// event
			$websocketSwitch.on('change', function () {
				if ($(this).prop('checked')) {
					connect();
				} else {
					disconnect();
				}
			});
			if ($websocketSwitch.prop('checked')) {
				connect();
			}
		} else {
			if (debugEnabled) {
				console.log('flayWebsocket', 'switch is not exist. will be connected automatically');
			}
			connect();
		}

		// if wrapper not exist, insert
		if ($('#' + wrapper).length === 0) {
			$('body > footer').append(
				$('<div>', { id: wrapper }).css({
					position: 'fixed',
					right: 0,
					zIndex: 69,
				}),
			);
		}
		const bottomHeight = $('.fixed-bottom').length === 0 || $('.fixed-bottom').css('display') === 'none' ? 0 : $('.fixed-bottom').height() + 16;
		$('#' + wrapper).css({
			bottom: bottomHeight,
		});
	});

	return {
		say: (message, to) => {
			if (!username) {
				alert('User info is not exist!!!');
				return;
			}
			stompClient.send(
				'/flayground/say' + (to ? 'To' : ''),
				{
					to: to,
				},
				JSON.stringify({
					name: username,
					content: message,
				}),
			);
		},
		info: (payLoad) => {
			stompClient.send(
				'/flayground/info',
				{},
				JSON.stringify({
					name: username,
					content: payLoad,
				}),
			);
		},
		stop: disconnect,
		debug: (onOff) => {
			debugEnabled = onOff;
		},
	};
})(jQuery);
