/**
 * 
 */

var event = {
		resize: function() {
			$(window).on("resize", function() {
				$("#background_images img").css({height: ''});
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
		theme: function() {
			// background theme
			$("input[name='bgTheme']").on("change", function() {
				var isDark = $("input[name='bgTheme']:checked").val() === 'D';
				$("body").toggleClass("bg-dark", isDark);
				$("label.text, div.input-group, label.input, .ranker, input.search, .cover-box").toggleClass("dark", isDark);
			});
			$("#bgColor").on("change", function() {
				$("body").css({backgroundColor: $(this).val()});
			});
		},
		bgToggle: function() {
			$("#bgFlow").on("change", function() {
				$(this).prop("checked") ? background.start() : background.stop();
			});
		}
};

var background = {
		imageIndexArray: [],
		bgInterval: null,
		count: 0,
		init: function() {
			Rest.Image.size(function(count) {
				background.count = count;
			});
		},
		start: function() {
			background.bgInterval = setInterval(background.func, 3000);
		},
		stop: function() {
			clearInterval(background.bgInterval);
		},
		func: function() {
			// make image index array
			if (background.imageIndexArray.length === 0) {
				background.imageIndexArray = Array.apply(null, {length: background.count}).map(Number.call, Number);
				console.log('image array reset', background.imageIndexArray.length);
			}
			// determine image index
			var imageIndex = background.imageIndexArray.splice(Random.getInteger(0, background.imageIndexArray.length-1), 1);
			if ($.isEmptyObject(imageIndex)) {
				console.log('imageIndex is empty', background.imageIndexArray.length, imageIndex);
			}
			var $imageWrap = $("#image_pane_" + Random.getInteger(0, 3));
			
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

var navi = {
		init: function() {
			$("[aria-include]").on("click", function() {
				var dest = $(this).attr("aria-include");
				navi.go(dest);
			});
		},
		go: function(destination) {
			Rest.Html.get(destination, function(html) {
				$(window).off();
				$("#wrap_body").html(html);
			});
		}
};

$(document).ready(function() {

	event.resize();
	event.togglePage();
	event.theme();
	event.bgToggle();
	
	background.init();
	background.start();

	navi.init();
	$("[aria-include]").first().click();

});

window.onerror = function(e) {
    console.error('Error', e);
    loading.on('Error: ' + e);
};
