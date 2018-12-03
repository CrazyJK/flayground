/**
 * flaygound notification
 * ref. http://jmesnil.net/stomp-websocket/doc/
 */
 
$(function () {
	notification.start();
});

window.onunload = function() {
	notification.disconnect();
};

var SHOUT = 'SHOUT',
	ANNOUNCE = 'ANNOUNCE',
	notification = {
		stompClient: null,
		STOMP_ENDPOINT: "/flayground-notification",
		DESTINATION_ANNOUNCE: "/announce/listen",
		DESTINATION_SHOUT: "/shout/listen",
		start: function() {
			$("head").append(
					'<script type="text/javascript" src="/webjars/sockjs-client/sockjs.min.js"></script>',
					'<script type="text/javascript" src="/webjars/stomp-websocket/stomp.min.js"></script>'
			);

			if ($("#notification").length > 0) {
				$("#notification").on("change", function() {
					if ($(this).prop("checked")) {
						notification.connect();
					} else {
						notification.disconnect();
					}
				});
			
				$("#notification").prop("checked", true).trigger("change");
			} else {
				notification.connect();
			}
		},
		connect: function connect() {
		    var socket = new SockJS(notification.STOMP_ENDPOINT);
		    notification.stompClient = Stomp.over(socket);
		    notification.stompClient.connect({}, function (frame) {
		    	notification.notify(ANNOUNCE, frame);

		    	notification.stompClient.subscribe(notification.DESTINATION_ANNOUNCE, function (message) {
		    		notification.notify(ANNOUNCE, message);
		        });

		    	notification.stompClient.subscribe(notification.DESTINATION_SHOUT, function (message) {
		    		notification.notify(SHOUT, message);
		        });

		    }, function(frame) {
		    	notification.notify(ANNOUNCE, frame);
		    });
		    
		    notification.stompClient.debug = function(str) {
//		    	console.log("debugggg", str);
		    };
		},
		disconnect: function disconnect() {
		    if (notification.stompClient !== null) {
		    	notification.stompClient.disconnect(function() {
				    notification.notify(ANNOUNCE, {
				    	command: "DISCONNECTED"
				    });
		    	});
		    }
		},
		notify: function(type, message) {
			var hideBox = function($box) {
				$box.hide("slide", {direction: 'right'}, function() {
		    		$(this).remove();
		    	});
			}, showBox = function($box) {
				$box.show("blind", {direction: 'right'})
			};
//			console.log("notify", type, message);
			
			var command, title, content = "", time = new Date();
			if (message.command === 'CONNECTED') {
				title   = 'Connected';
				content = "signed in " + message.headers['user-name'];
			} else if (message.command === 'DISCONNECTED') {
				title   = 'Disconnected';
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
			
			// if wrapper not exist, insert
			if ($("#announceWrapper").length === 0) {
				$("body").append(
						$("<div>", {'id': 'announceWrapper'})
				);
			}
			
		    var $box = $("<div>", {'class': 'announce bg-dark text-light'}).append(
					$("<i>", {'class': 'fa fa-bell float-left'}),
					$("<i>", {'class': 'item-close fa fa-times float-right'}).on("click", function() {
						hideBox($box);
					}),
					$("<small>", {'class': 'item-time float-right'}).html(time.format("a/p hh:mm")),
		    		$("<div>", {'class': 'announce-body'}).append(
							$("<h6>", {'class': 'item-title'}).append(
									(type === SHOUT ? "<span class='text-primary'>From</span> " : ""), 
									title
							),
							$("<div>", {'class': 'item-content'}).append(content)
		    		)
			).hide().appendTo($("#announceWrapper"));
		    showBox($box);
		    
		    setTimeout(function() {
		    	hideBox($box);
		    }, 10*1000);
		},
		shout: function(message) {
			notification.stompClient.send("/flay/shout", {}, JSON.stringify({
		    	'name': username,
		    	'content': message
		    }));
		}
};
