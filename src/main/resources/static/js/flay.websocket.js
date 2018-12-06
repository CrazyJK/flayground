/**
 * flaygound websocket
 * ref. http://jmesnil.net/stomp-websocket/doc/
 */

var flayWebsocket = (function($) {
	var STOMP_ENDPOINT = "/flayground-websocket",
		DESTINATION_ANNOUNCE = "/announce/listen",
		DESTINATION_SHOUTING = "/shouting/listen",
		stompClient = null;

	var SHOUTING = 'SHOUTING', ANNOUNCE = 'ANNOUNCE';
	var switchSelector = '#notification';

	$("head").append(
			'<script type="text/javascript" src="/webjars/sockjs-client/sockjs.min.js"></script>',
			'<script type="text/javascript" src="/webjars/stomp-websocket/stomp.min.js"></script>'
	);

	$(document).ready(function() {
		var $websocketSwitch = $(switchSelector);
		if ($websocketSwitch.length > 0) {
			$websocketSwitch.on("change", function() {
				$(this).prop("checked") ? connect() : disconnect();
			});
		
			if ($websocketSwitch.prop("checked"))
				connect();
		} else {
			console.log('flayWebsocket', 'switch is not exist. will be connected automatically');
			connect();
		}
	});

	window.onunload = disconnect;

	var connect = function() {
	    var socket = new SockJS(STOMP_ENDPOINT);
	    stompClient = Stomp.over(socket);
	    stompClient.connect({}, function(frame) {
			console.log('flayWebsocket', 'connected');

			showMessage(ANNOUNCE, frame);

	    	// announce subscribe
	    	stompClient.subscribe(DESTINATION_ANNOUNCE, function (message) {
	    		showMessage(ANNOUNCE, message);
	        });

	    	// shout subscribe
	    	stompClient.subscribe(DESTINATION_SHOUTING, function (message) {
	    		showMessage(SHOUTING, message);
	        });

	    }, function(frame) {
	    	showMessage(ANNOUNCE, frame);
	    });
	    
	    stompClient.debug = function(str) {
	    	//console.log("stomp debug", str);
	    };
	};

	var disconnect = function() {
	    if (stompClient !== null) {
	    	stompClient.disconnect(function() {
	    		console.log('flayWebsocket', 'disconnected');
	    		showMessage(ANNOUNCE, {command: "DISCONNECTED"});
	    	});
	    }
	};

	var shout = function(message) {
		if (!username) {
			alert('User info is not exist!!!');
		}
		stompClient.send("/flay/shout", {}, JSON.stringify({
	    	'name': username,
	    	'content': message
	    }));
	};
	
	var showMessage = function(type, message) {
		var title, content, time = new Date();
		if (message.command === 'CONNECTED') {
			title   = 'Connected';
			content = "signed in " + message.headers['user-name'];
		} else if (message.command === 'DISCONNECTED') {
			title   = 'Disconnected';
			content = '';
		} else if (message.command === 'MESSAGE') {
			var body = JSON.parse(message.body);
			title   = body.title;
			content = body.content;
			time.setTime(body.time);
		} else {
			title = "<span class='text-danger'>" + ANNOUNCE + "</span>";
			content = message;
		}
		content = content.trim().replace(/\n/g, '<br>');
		console.log('websocket', type, title, content);

		// if wrapper not exist, insert
		var wrapper = "announceWrapper";
		if ($("#" + wrapper).length === 0)
			$("body").append(
					$("<div>", {id: wrapper}).css({
						position: 'fixed',
						bottom: 50,
						right: 0,
						zIndex: 69
					})
			);

		var showBox = function(_box) {
			_box.show("blind", {direction: 'right'})
		}, hideBox = function(_box) {
			_box.hide("slide", {direction: 'right'}, function() {
				$(this).remove();
			});
		};

		var $box = $("<div>", {'class': 'bg-dark text-light rounded m-2 p-2'}).css({
			border: '1px solid #ddd',
			boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, .125)',
			display: 'none',
			width: 250
		}).append(
				$("<i>", {'class': 'fa fa-bell float-left'}),
				$("<i>", {'class': 'fa fa-times float-right hover'}).on("click", function() {
					hideBox($(this).parent());
				}),
				$("<small>", {'class': 'float-right mr-2'}).html(time.format("a/p hh:mm")),
				$("<div>", {'class': 'ml-4'}).append(
						$("<h6>", {'class': 'font-weight-bold m-0'}).append((type === SHOUTING ? "<span class='text-primary'>From</span> " : ""), title),
						$("<div>", {'class': 'mt-2'}).css({
							fontSize: '.875rem'
						}).append(content)
				)
		).appendTo($("#" + wrapper));
		showBox($box);

		setTimeout(function() {
			hideBox($box);
		}, 10 * 1000);
	};

	return {
		shout: shout,
		stop: disconnect
	};

}(jQuery));

