/**
 * flaygound notification
 */
 
$(function () {
	notification.start();
});

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

			$("input[name='notification']").on("change", function() {
				var notiSwitch = $("input[name='notification']:checked").val() === 'T';
				if (notiSwitch) {
					notification.connect();
				} else {
					notification.disconnect();
				}
			});

			$("input[name='notification'][value='T']").prop("checked", true).trigger("change");
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

		    });
		},
		disconnect: function disconnect() {
		    if (notification.stompClient !== null) {
		    	notification.stompClient.disconnect();
		    }
		    notification.notify("Disconnected");
		},
		notify: function displayNotice(message, extraMessage) {
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
			content = content.replace(/\n/g, '<br>');
			
			// if wrapper not exist, insert
			if ($("#announceWrapper").length == 0) {
				$("body").append(
						$("<div>", {'id': 'announceWrapper'})
				);
			}
			
		    var $box = $("<div>", {'class': 'announce-box'}).append(
		    		$("<div>", {'class': 'float-right'}).append(
		    				$("<small>", {'class': 'item-time'}).html(time.format("hh:mm")),
		    				$("<span>", {'class': 'item-close'}).append(
		    						$("<i>", {'class': 'fa fa-times'}).on("click", function() {
		    							hideBox($box);
		    						})
		    				)
		    		),
					$("<p>", {'class': 'item-title'}).html(title),
					$("<p>", {'class': 'item-content'}).html(content)
			).hide().appendTo($("#announceWrapper"));
		    showBox($box);
		    
		    setTimeout(function() {
		    	hideBox($box);
		    }, 10*1000);
		}
};
