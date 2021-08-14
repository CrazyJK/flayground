/**
 * flay.index.js
 */
"use strict";

var SlideMenu = {
		init: function() {
			$.ajax({
				url: "/data/main.menu.json",
				success: function (menuItems) {
					SlideMenu.setMenu(menuItems);
					SlideMenu.theme();
					SlideMenu.togglePage();
					SlideMenu.setUsername();
					SlideMenu.startLifeTimer();
					SlideMenu.specialView();
				},
			});
		},
		setMenu: function (menuItems) {
			let $wrap = $("#mainMenuWrap");
			menuItems.forEach(function (menu) {
				let $li = $("<li>", { class: "nav-item" });
				let $icon = $("<i>", { class: menu.icon });
				let $menu = $("<div>");
				let $name = $("<a>").html(menu.name).on("click", function() {
					if (menu.mode === "include") {
						Rest.Html.get(menu.uri, function (html) {
							try {
								$("#notice").dialog("close");
							} catch (ignore) {}
							try {
								destory();
							} catch (ignore) {}
							$("#wrap_body").html(html);
						});
					} else if (menu.mode === "href") {
						location.href = menu.uri;
					} else {
						console.error("Notfound mode", menu);
					}
					$(".nav-wrap .active").removeClass("active");
					$(this).addClass("active");
				});
				let $popup =
					menu.popup.w === 0 || menu.popup.h === 0
						? $("<a>")
						: $("<a>")
								.on("click", function () {
									let url = null;
									if (menu.mode === "include") {
										url = "/html/flay/flay.popup.html?target=" + menu.uri;
									} else if (menu.mode === "href") {
										url = menu.uri;
									} else {
										console.error("Notfound mode", menu);
									}
									Popup.open(url, menu.name, menu.popup.w, menu.popup.h);
								})
								.append($("<i>", { class: "fa fa-external-link ml-1 hover" }));

				$li.append($icon, $menu.append($name, $popup)).appendTo($wrap);
			});
		},
		theme: function() {
			var setTheme = function() {
				var bgThemeValue = $("input[name='bgTheme']:checked").val();
				$("body").toggleClass("bg-dark", bgThemeValue === 'D');
				LocalStorageItem.set('flay.bgtheme', bgThemeValue);
				// broadcasting
				try {
					flayWebsocket.info('bgtheme');
				} catch (e) {}
			},
			bgTheme = LocalStorageItem.get('flay.bgtheme', 'D'),
			bgColor = LocalStorageItem.get('flay.bgcolor', '#000000');

			$('#bgTheme' + bgTheme).parent().click();
			$("input[name='bgTheme']").on("change", setTheme).trigger("change");

			$("#bgColor").on("change", function() {
				$("body").css({backgroundColor: $(this).val()});
				LocalStorageItem.set('flay.bgcolor', $(this).val());
				// broadcasting
				try {
					flayWebsocket.info('bgcolor');
				} catch (e) {}
			});
			$("#bgColor").val(bgColor).trigger("change");
		},
		togglePage: function() {
			$("#pageShow").on("change", function() {
				var isShow = $(this).prop("checked");
				$("#wrap_body").toggle(isShow);
				$("#background_images").css({backgroundColor: isShow ? 'rgba(0,0,0,.5)' : 'transparent'});
				$("#background_images .col").css({zIndex: isShow ? -3 : 0});
			});
		},
		setUsername() {
			$("#username").html(username);
		},
		startLifeTimer() {
			$("#lifeTimerWrapper").lifeTimer({
				progress: false,
				pattern: 'day Days',
				onlyOnce: true
			});
		},
		specialView: function() {
			if (Security.isAutomaticallyCertificated()) {
				var selectedBgIndex = -1;
				$(".sidenav > .nav-wrap > .nav > .nav-item > i + label, "
				+ ".sidenav > .nav-wrap > .nav > .nav-item > i + a").hover(function() {
					selectedBgIndex = Random.getInteger(0, Background.count);
					$("#specialView").css({
						backgroundImage: "url('/static/image/" + selectedBgIndex + "')"
					});
				}, function() {});
				$(".sidenav > h4 > a").hover(function() {
					$("#specialView").css("backgroundImage", "");
				}, function() {});
				$(".sidenav > h4 > img").on("click", function() {
					Popup.imageByNo(selectedBgIndex);
				});
			} else {
				$("#specialView").hide();
			}
		}
};

var Background = {
		imageIndexArray: [],
		bgInterval: null,
		count: 0,
		paneWidth: LocalStorageItem.getInteger('flay.background-image.paneWidth', 400),
		intervalTime: 3000,
		init: function() {
			Rest.Image.size(function(count) {
				Background.count = count;
			});
			Background.event();
		},
		event: function() {
			var paneResize = function() {
				var paneLength = Math.round($(window).width() / Background.paneWidth) - $("#background_images").children().length;
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
			// paneWidth
			$("#paneWidth").on("change", function() {
				Background.paneWidth = $(this).val();
				paneResize();
				LocalStorageItem.set('flay.background-image.paneWidth', Background.paneWidth);
			}).val(Background.paneWidth);
			// switch
			$("#bgFlow").on("change", function() {
				$(this).prop("checked") ? Background.start() : Background.stop();
			});
			var backgroundImageShow = LocalStorageItem.getBoolean('flay.background-image', true);
			backgroundImageShow && $("#bgFlow").parent().click();
		},
		start: function() {
			Background.bgInterval = setInterval(Background.func, Background.intervalTime);
			LocalStorageItem.set('flay.background-image', true);
		},
		stop: function() {
			clearInterval(Background.bgInterval);
			LocalStorageItem.set('flay.background-image', false);
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
				var $thisImage = $(this).css({height: 0}).prependTo($imageWrap).on("click", function() {
					Popup.imageByNo(imageIndex);
				});
				// showing
				setTimeout(function() {
					$thisImage.css({
						height: calcImgHeight
					});
				}, 100);
			};
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

var isAdmin;
var username;

$(document).ready(function() {
	isAdmin = Security.hasRole("ADMIN");
	username = Security.getName();
	console.log("isAdmin", isAdmin, username);

	Background.init();

	SlideMenu.init();
});

window.onerror = function(e) {
    console.error('Error', e);
    loading.on('Error: ' + e);
};
