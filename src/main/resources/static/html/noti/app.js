var stompClient = null;
var STOMP_ENDPOINT = "/flayground-notification",
	DESTINATION_SHOUT = "/shout/listen",
	DESTINATION_ANNOUNCE = "/announce/listen";

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    }
    else {
        $("#conversation").hide();
    }
    $("#greetings").html("");
}

function connect() {
    var socket = new SockJS(STOMP_ENDPOINT);
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        setConnected(true);
        console.log('Connected: ', frame);

        stompClient.subscribe(DESTINATION_SHOUT, function (message) {
        	console.log(DESTINATION_SHOUT, message);
        	showShout(message);
        });
        
        stompClient.subscribe(DESTINATION_ANNOUNCE, function (message) {
        	console.log(DESTINATION_ANNOUNCE, message);
        	showNotice(message);
        });
        
    });
}

function getSubscribeMessageBody(message) {
	console.log(message.headers['content-type']);
	if (message.headers['content-type'].indexOf('application/json') > -1) {
		return JSON.parse(message.body);
	} else {
		return message.body;
	}
}

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}

function shout() {
    stompClient.send("/flay/shout", {}, JSON.stringify({
    	'name': $("#name").val(),
    	'content': $("#content").val()
    }));
    $("#content").val('');
}

function showShout(message) {
	function getSubscribeMessageBody(message) {
		if (message.headers['content-type'].indexOf('application/json') > -1) {
			return JSON.parse(message.body);
		} else {
			return message.body;
		}
	}
	var body = getSubscribeMessageBody(message);
    $("#shoutings").append(
    		$("<div>", {'class': 'subscribe-item'}).append(
    				$("<span>", {'class': 'item-from'}).html(body.title),
    				$("<span>", {'class': 'item-time'}).html("(" + getDateString(new Date(body.time)) + ")"),
    				$("<p>", {'class': 'item-content'}).html(body.content.replace(/\n/g, '<br>'))
    		)
    );
    scrollTop();
}

function showNotice(message) {
	function getSubscribeMessageBody(message) {
		if (message.headers['content-type'].indexOf('application/json') > -1) {
			return JSON.parse(message.body);
		} else {
			return {time: new Date(), content: message.body};
		}
	}
	var body = getSubscribeMessageBody(message);
	
	if ($("#announceWrapper").length == 0) {
		$("body").append(
				$("<div>", {'id': 'announceWrapper'})
		);
	}
		
    var $box = $("<div>", {'class': 'announce-box'}).append(
    		$("<div>", {'class': 'float-right'}).append(
    				$("<small>", {'class': 'item-time'}).html(getSimpleTimeString(new Date(body.time))),
    				$("<span>", {'class': 'item-close'}).append(
    						$("<i>", {'class': 'fa fa-times'}).on("click", function() {
    							$(this).parent().parent().parent().remove();
    						})
    				)
    		),
			$("<p>", {'class': 'item-content'}).html(body.title),
			$("<p>", {'class': 'item-content'}).html(body.content.replace(/\n/g, '<br>'))
	).hide().prependTo($("#announceWrapper")).show("blind", {direction: 'right'});
    
    setTimeout(function() {
    	$box.hide("slide", {direction: 'right'}, function() {
    		$(this).remove();
    	});
    }, 10*1000);
}

function getDateString(date) {
	return date.getFullYear() + "." 
			+ ('0' + (date.getMonth() + 1)).slice(-2) + "." 
			+ ('0' + date.getDate()).slice(-2) + " "	
			+ ('0' + date.getHours()).slice(-2) + ":" 
			+ ('0' + date.getMinutes()).slice(-2) + ":" 
			+ ('0' + date.getSeconds()).slice(-2);
}

function getSimpleTimeString(date) {
	return ('0' + date.getHours()).slice(-2) + ":" 
			+ ('0' + date.getMinutes()).slice(-2);
}

function scrollTop() {
	$(".subscribe-area").scrollTop($(".subscribe-items").height() - $(".subscribe-area").height());
}

$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $("#connect").click(function() { 
    	connect();
    }).trigger("click");
    $("#disconnect").click(function() { 
    	disconnect();
    });
    $("#send").click(function() { 
    	shout();
    });
    $("#push").click(function() {
    	ifrm.src = '/notice/push/' + $("#clientMessageTitle").val() + "/" + $("#clientMessageContent").val();
    });
});

