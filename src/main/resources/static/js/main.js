/**
 * flay.main.js
 */
"use strict";

var SlideMenu = {
	init: function () {
		$.ajax({
			url: "/data/main.menu.json",
			success: function (menuItems) {
				SlideMenu.setMenu(menuItems);
				SlideMenu.pin();
				SlideMenu.toggleContent();
				SlideMenu.theme();
				SlideMenu.startLifeTimer();
				SlideMenu.specialView();
			},
		});
	},
	logout: function(logoutUri) {
		var logoutForm = document.createElement("form");
		logoutForm.setAttribute("method", "POST");
		logoutForm.setAttribute("action", logoutUri);

		var csrfField = document.createElement("input");
		csrfField.setAttribute("type", "hidden");
		csrfField.setAttribute("name", "_csrf");
		// csrfField.setAttribute("value", csrfValue);
		logoutForm.appendChild(csrfField);

		document.body.appendChild(logoutForm);

		document.cookie.split(';').forEach((cookie) => {
			if ("XSRF-TOKEN" === cookie.substr(0, cookie.indexOf('=')).replace(/^\s+|\s+$/g, '')) {
				document.querySelector("input[name='_csrf']").value = unescape(cookie.substr(cookie.indexOf('=') + 1));
				return false;
			}
		});

		logoutForm.submit();
	},
	setMenu: function (menuItems) {
		let $wrap = $("#mainMenuWrap");
		menuItems.forEach(function (menu) {
			let $li = $("<li>", { class: "nav-item" });
			let $icon = $("<i>", { class: menu.icon });
			let $menu = $("<div>");
			let $name = $("<a>")
				.html(menu.name)
				.on("click", function () {
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
					} else if (menu.mode === "post") {
						SlideMenu.logout(menu.uri);
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
		$("#username").html(username);
	},
	pin: function () {
		$(".sidenav-pin")
			.data("pin", false)
			.on("click", function () {
				var status = $(this).data("pin");
				$(".sidenav").css({
					width: status ? "0" : "var(--sidenav-width)",
				});
				$(this).data("pin", !status).toggleClass("active", !status);
			});
	},
	toggleContent: function () {
		$("#pageShow").on("change", function () {
			var isShow = $(this).prop("checked");
			$("#wrap_body").toggle(isShow);
			$("#background_images").css({ backgroundColor: isShow ? "rgba(0,0,0,.5)" : "transparent" });
			$("#background_images .col").css({ zIndex: isShow ? -3 : 0 });
		});
	},
	theme: function () {
		var setTheme = () => {
			var bgThemeValue = $("input[name='bgTheme']:checked").val();
			$("body").toggleClass("bg-dark", bgThemeValue === "D");
			LocalStorageItem.set("flay.bgtheme", bgThemeValue);
			// broadcasting
			try {
				flayWebsocket.info("bgtheme");
			} catch (e) {}
		};
		let bgTheme = LocalStorageItem.get("flay.bgtheme", "D");
		let bgColor = LocalStorageItem.get("flay.bgcolor", "#000000");
		// Theme
		$("#bgTheme" + bgTheme)
			.parent()
			.click();
		$("input[name='bgTheme']").on("change", setTheme).trigger("change");
		// BG Color
		$("#bgColor")
			.val(bgColor)
			.on("change", function () {
				$("body").css({ backgroundColor: $(this).val() });
				try {
					// broadcasting
					flayWebsocket.info("bgcolor");
				} catch (e) {}
				LocalStorageItem.set("flay.bgcolor", $(this).val());
			})
			.trigger("change");
	},
	startLifeTimer() {
		$("#lifeTimerWrapper").lifeTimer({
			progress: false,
			pattern: "day Days",
			onlyOnce: true,
		});
	},
	specialView: function () {
		if (Security.isAutomaticallyCertificated()) {
			var selectedBgIndex = -1;
			$("#mainMenuWrap > li > div > a:nth-child(1)").hover(
				function () {
					selectedBgIndex = Random.getInteger(0, Background.count);
					$("#specialView").css({
						backgroundImage: "url('/static/image/" + selectedBgIndex + "')",
					});
				},
				function () {}
			);
			$(".sidenav > h4 > a").hover(
				function () {
					$("#specialView").css("backgroundImage", "");
				},
				function () {}
			);
			$(".sidenav > h4 > img").on("click", function () {
				Popup.imageByNo(selectedBgIndex);
			});
		} else {
			$("#specialView").hide();
		}
	},
};

var Background = {
	imageIndexArray: [],
	bgInterval: null,
	count: 0,
	paneWidth: LocalStorageItem.getInteger("flay.background-image.paneWidth", 400),
	intervalTime: 3000,
	init: function () {
		Rest.Image.size(function (count) {
			Background.count = count;
		});
		Background.event();
	},
	event: function () {
		var paneResize = function () {
			let addedPaneLength = Math.round($(window).width() / Background.paneWidth) - $("#background_images div.col").length;
			if (addedPaneLength > 0) {
				for (var i = 0; i < addedPaneLength; i++) {
					$("<div>", { class: "col" }).appendTo($("#background_images"));
				}
			} else {
				for (; addedPaneLength < 0; addedPaneLength++) {
					$("#background_images div.col:last-child").remove();
				}
			}
			$("#background_images img").css({ height: "" });
		};
		paneResize();
		$(window).on("resize", paneResize);
		// paneWidth
		$("#paneWidth")
			.on("change", function () {
				Background.paneWidth = $(this).val();
				paneResize();
				LocalStorageItem.set("flay.background-image.paneWidth", Background.paneWidth);
			})
			.val(Background.paneWidth);
		// Picture switch
		$("#bgFlow").on("change", function () {
			$(this).prop("checked") ? Background.start() : Background.stop();
		});
		var backgroundImageShow = LocalStorageItem.getBoolean("flay.background-image", true);
		backgroundImageShow && $("#bgFlow").parent().click();
	},
	start: function () {
		Background.bgInterval = setInterval(Background.func, Background.intervalTime);
		LocalStorageItem.set("flay.background-image", true);
	},
	stop: function () {
		clearInterval(Background.bgInterval);
		LocalStorageItem.set("flay.background-image", false);
	},
	func: function () {
		// make image index array
		if (Background.imageIndexArray.length === 0) {
			Background.imageIndexArray = Array.apply(null, { length: Background.count }).map(Number.call, Number);
			console.info("image array reset", Background.imageIndexArray.length);
		}
		// determine image index
		var imageIndex = Background.imageIndexArray.splice(Random.getInteger(0, Background.imageIndexArray.length - 1), 1);
		if ($.isEmptyObject(imageIndex)) {
			console.info("imageIndex is empty", Background.imageIndexArray.length, imageIndex);
		}
		// select image pane
		var paneLength = $("#background_images div.col").length;
		var $imageWrap = $("#background_images div.col:nth-child(" + Random.getInteger(1, paneLength) + ")");
		// load image
		var image = new Image();
		image.onload = function () {
			// calculate size
			var calcImgWidth = parseInt($imageWrap.width());
			var calcImgHeight = parseInt((calcImgWidth * this.naturalHeight) / this.naturalWidth);
			// append new image
			var $thisImage = $(this)
				.css({ height: 0 })
				.on("click", function () {
					Popup.imageByNo(imageIndex);
				})
				.prependTo($imageWrap);
			// showing
			setTimeout(function () {
				$thisImage.css({
					height: calcImgHeight,
				});
			}, 100);
		};
		image.src = PATH + "/static/image/" + imageIndex;
		// overflow image remove
		$imageWrap.children().each(function () {
			var imageTop = $(this).position().top;
			var bgHeight = $("#background_images").height();
			if (imageTop > bgHeight) {
				$(this).remove();
			}
		});
	},
};

let isAdmin;
let username;

$(document).ready(function () {
	isAdmin = Security.hasRole("ADMIN");
	username = Security.getName();
	console.info(`User is ${username} ${isAdmin ? "has ADMIN Role" : ""}`);

	Background.init();

	SlideMenu.init();
});

window.onerror = function (e) {
	console.error("Error", e);
	loading.on("Error: " + e);
};
