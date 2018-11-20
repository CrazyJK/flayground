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

var notification = {
		stompClient: null,
		STOMP_ENDPOINT: "/flayground-notification",
		DESTINATION_SHOUT: "/shout/listen",
		DESTINATION_ANNOUNCE: "/announce/listen",
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
		    	notification.notify('Connected', frame);
		      
		    	notification.stompClient.subscribe(notification.DESTINATION_ANNOUNCE, function (message) {
		    		notification.notify(message);
		        });

		    	notification.stompClient.subscribe(notification.DESTINATION_SHOUT, function (message) {
		    		notification.notify(message);
		        });

		    }, function(frame) {
		    	notification.notify("Error", frame);
		    });
		    
		    notification.stompClient.debug = function(str) {
		    	console.log("debugggg", str);
		    };
		},
		disconnect: function disconnect() {
		    if (notification.stompClient !== null) {
		    	notification.stompClient.disconnect(function() {
				    notification.notify("Disconnected");
		    	});
		    }
		},
		notify: function(message, extraMessage) {
			var getSubscribeMessageBody = function(message) {
				if (message.headers['content-type'].indexOf('application/json') > -1) {
					return JSON.parse(message.body);
				} else {
					return {time: new Date(), title: JSON.stringify(message), content: ''};
				}
			}, hideBox = function($box) {
				$box.hide("slide", {direction: 'right'}, function() {
		    		$(this).remove();
		    	});
			}, showBox = function($box) {
				$box.show("blind", {direction: 'right'})
			};
			
			console.log("message", message);
			
			var title, content = "", time = new Date();
			if (typeof message === 'string') {
				title = message;
			} else if (typeof message === 'object') {
				var messageBody = getSubscribeMessageBody(message);
				title   = messageBody.title;
				content = messageBody.content;
				time.setTime(messageBody.time);
			} else {
				title = JSON.stringify(message);
			}
			if (extraMessage) {
				content = content != '' ? content + "<br>" + extraMessage : "" + extraMessage;
			}
			content = content.trim().replace(/\n/g, '<br>');
			
			// if wrapper not exist, insert
			if ($("#announceWrapper").length == 0) {
				$("body").append(
						$("<div>", {'id': 'announceWrapper'})
				);
			}
			
		    var $box = $("<div>", {'class': 'announce bg-dark text-light'}).append(
					$("<i>", {'class': 'fa fa-bell float-left'}),
					$("<i>", {'class': 'item-close fa fa-times float-right'}).on("click", function() {
						hideBox($box);
					}),
					$("<small>", {'class': 'item-time float-right'}).html(time.format("hh:mm")),
		    		$("<div>", {'class': 'announce-body'}).append(
							$("<h6>", {'class': 'item-title'}).html(title),
							$("<div>", {'class': 'item-content'}).html(content)
		    		)
			).hide().appendTo($("#announceWrapper"));
		    showBox($box);
		    
		    setTimeout(function() {
		    	hideBox($box);
		    }, 10*1000);
		}
};
