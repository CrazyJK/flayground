/**
 * flay.index.js
 */

var Event = {
		theme: function() {
			// background theme
			$("input[name='bgTheme']").on("change", function() {
				var isDark = $("input[name='bgTheme']:checked").val() === 'D';
				$("body").toggleClass("bg-dark", isDark);
//				$("label.text, div.check-group, label.check, .ranker, input.search, .cover-box").toggleClass("bg-dark", isDark);
			});
			$("#bgColor").on("change", function() {
				$("body").css({backgroundColor: $(this).val()});
			});
		},
		togglePage: function() {
			$("#pageShow").on("change", function() {
				var isShow = $(this).prop("checked");
				$("#wrap_body").toggle(isShow);
				$("#background_images").css({backgroundColor: isShow ? 'rgba(0,0,0,.5)' : 'transparent'});
				$("#background_images .col").css({zIndex: isShow ? -3 : 0});
			});
		},
		toggleBackground: function() {
			$("#bgFlow").on("change", function() {
				$(this).prop("checked") ? Background.start() : Background.stop();
			});
		}
};

var Background = {
		imageIndexArray: [],
		bgInterval: null,
		count: 0,
		init: function() {
			Rest.Image.size(function(count) {
				Background.count = count;
			});
			Background.event();
		},
		event: function() {
			var paneResize = function() {
				var paneLength = Math.round($(window).width() / 300) - $("#background_images").children().length;
				if (paneLength > 0) {
					for (var i=0; i<paneLength; i++) {
						$("<div>", {'class': 'col'}).appendTo($("#background_images"));
					}
				} else {
					for (; paneLength<0; paneLength++) {
						$("#background_images div.col:last-child").remove();
					}
				}
				$("#background_images img").css({height: ''});
			};
			paneResize();
			$(window).on("resize", paneResize);
		},
		start: function() {
			Background.bgInterval = setInterval(Background.func, 3000);
		},
		stop: function() {
			clearInterval(Background.bgInterval);
		},
		func: function() {
			// make image index array
			if (Background.imageIndexArray.length === 0) {
				Background.imageIndexArray = Array.apply(null, {length: Background.count}).map(Number.call, Number);
				console.log('image array reset', Background.imageIndexArray.length);
			}
			// determine image index
			var imageIndex = Background.imageIndexArray.splice(Random.getInteger(0, Background.imageIndexArray.length-1), 1);
			if ($.isEmptyObject(imageIndex)) {
				console.log('imageIndex is empty', Background.imageIndexArray.length, imageIndex);
			}
			// select image pane
			var paneLength = $("#background_images").children().length;
			var $imageWrap = $("#background_images div.col:nth-child(" + Random.getInteger(0, paneLength) + ")");
			
			var image = new Image();
			image.onload = function() {
				// calculate size
				var calcImgWidth  = parseInt($imageWrap.width());
				var calcImgHeight = parseInt(calcImgWidth * this.naturalHeight / this.naturalWidth);
				// append new image
				$(this).css({height: 0}).addClass("rounded").prependTo($imageWrap).css({height: calcImgHeight}).on("click", function() {
					Popup.imageByNo(imageIndex);
				});
			}
			image.src = PATH + "/static/image/" + imageIndex;
			
			// overflow image remove
			$imageWrap.children().each(function() {
				var imageTop = $(this).position().top;
				var bgHeight = $("#background_images").height();
				if (imageTop > bgHeight) {
					$(this).remove();
				}
			});
		}
};

var Navi = {
		init: function() {
			$("[aria-include]").on("click", function() {
				$("[aria-include]").removeClass("active");
				Navi.go($(this).addClass("active").attr("aria-include"));
			});
		},
		go: function(destination) {
			Rest.Html.get(destination, function(html) {
				$(document).off('keyup');
				try {
					$("#notice").dialog("close");
				} catch(ignore) {}
				$("#wrap_body").html(html);
			});
		}
};

var Security = {
		user: null,
		getUser: function() {
			Rest.Security.whoami(function(principal) {
				Security.user = principal;
			});
		},
		hasRole: function(role) {
			if (Security.user == null) {
				Security.getUser();
			}
			for (var x in Security.user.authorities) {
				if (Security.user.authorities[x].authority === "ROLE_" + role) {
					return true;
				}
			}
			return false;
		},
		getName: function() {
			if (Security.user == null) {
				Security.getUser();
			}
			return Security.user.username;
		}
};

var isAdmin = Security.hasRole("ADMIN");
var username = Security.getName();
console.log("isAdmin", isAdmin, username);

$(document).ready(function() {

	Event.theme();
	Event.togglePage();
	Event.toggleBackground();
	
	Background.init();
	Background.start();

	Navi.init();
//	$("[aria-include]").first().click();

	$("#username").html(username);

	$("#lifeTimerWrapper").lifeTimer({
		progress: false,
		pattern: 'day Days'
	});
});

window.onerror = function(e) {
    console.error('Error', e);
    loading.on('Error: ' + e);
};
