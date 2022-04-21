/**
 * flay.main.js
 */

const SlideMenu = {
	init: () => {
		$.ajax({
			url: '/data/main.menu.json',
			success: (menuItems) => {
				SlideMenu.setMenu(menuItems);
				SlideMenu.pin();
				SlideMenu.toggleContent();
				SlideMenu.theme();
				SlideMenu.startLifeTimer();
				SlideMenu.specialView();
			},
		});
	},
	logout: (logoutUri) => {
		const logoutForm = document.createElement('form');
		logoutForm.setAttribute('method', 'POST');
		logoutForm.setAttribute('action', logoutUri);

		const csrfField = document.createElement('input');
		csrfField.setAttribute('type', 'hidden');
		csrfField.setAttribute('name', '_csrf');
		// csrfField.setAttribute("value", csrfValue);

		logoutForm.appendChild(csrfField);
		document.body.appendChild(logoutForm);

		document.cookie.split(';').forEach((cookie) => {
			if ('XSRF-TOKEN' === cookie.substr(0, cookie.indexOf('=')).replace(/^\s+|\s+$/g, '')) {
				document.querySelector("input[name='_csrf']").value = unescape(cookie.substr(cookie.indexOf('=') + 1));
				return false;
			}
		});

		logoutForm.submit();
	},
	setMenu: (menuItems) => {
		const $wrap = $('#mainMenuWrap');
		menuItems.forEach((menu) => {
			let $li = $('<li>', { class: 'nav-item' });
			let $icon = $('<i>', { class: menu.icon });
			let $menu = $('<div>');
			let $name = $('<a>', { class: menu.mode })
				.html(menu.name)
				.on('click', (e) => {
					if (menu.mode === 'include') {
						Rest.Html.get(menu.uri, (html) => {
							try {
								$('#notice').dialog('close');
							} catch (ignore) {}
							try {
								destory();
							} catch (ignore) {}
							$('#wrap_body').empty().html(html);
						});
					} else if (menu.mode === 'href') {
						location.href = menu.uri;
					} else if (menu.mode === 'logout') {
						SlideMenu.logout(menu.uri);
					} else {
						console.error('Notfound mode', menu);
					}
					document.title = menu.name + ' Flayground';
					$('.nav-wrap .active').removeClass('active');
					$(e.target).addClass('active');
				});
			let $popup = $('<a>');
			if (menu.popup.w !== 0 && menu.popup.h !== 0) {
				$popup
					.on('click', () => {
						let url = null;
						if (menu.mode === 'include') {
							url = '/html/main.popup.html?target=' + menu.uri;
						} else if (menu.mode === 'href') {
							url = menu.uri;
						} else {
							console.error('Notfound mode', menu);
						}
						Popup.open(url, menu.name, menu.popup.w, menu.popup.h);
					})
					.append($('<i>', { class: 'fa fa-external-link ml-1 hover' }));
			}
			$li.append($icon, $menu.append($name, $popup)).appendTo($wrap);
		});
		$('#username').html(username);
		$('#mainHome')
			.on('click', () => {
				document.title = 'Flayground';
				$('#wrap_body').empty();
				$('.nav-wrap .active').removeClass('active');
			})
			.attr('href', '#');
	},
	pin: () => {
		$('.sidenav-pin')
			.data('pin', false)
			.on('click', (e) => {
				const isPin = !$(e.target).data('pin');
				$('.sidenav').css({
					width: isPin ? 'var(--sidenav-width)' : '0',
				});
				$('main').css({
					left: isPin ? 'var(--sidenav-width)' : '0',
				});
				$(e.target).data('pin', isPin).toggleClass('active', isPin);
				SlideMenu.specialViewPause = isPin;
				$('#specialView').toggleClass('pause', isPin);

				setTimeout(() => {
					$(window).trigger('resize');
				}, 500);
			});
	},
	toggleContent: () => {
		$('#pageShow').on('change', (e) => {
			const isShow = $(e.target).prop('checked');
			$('#wrap_body').toggle(isShow);
			$('#background_images').css({ backgroundColor: isShow ? 'rgba(0,0,0,.5)' : 'transparent' });
			$('#background_images .col').css({ zIndex: isShow ? -3 : 0 });
		});
	},
	theme: () => {
		const setTheme = () => {
			const bgThemeValue = $("input[name='bgTheme']:checked").val();
			LocalStorageItem.set('flay.bgtheme', bgThemeValue);

			// adjust theme
			$(document).ready(() => {
				try {
					adjustTheme();
				} catch (error) {
					console.error('adjustTheme', error);
				}
			});

			// broadcasting
			try {
				flayWebsocket.info('bgtheme');
			} catch (e) {}
		};
		let bgTheme = LocalStorageItem.get('flay.bgtheme', 'dark');
		let bgColor = LocalStorageItem.get('flay.bgcolor', '#000000');
		// Theme
		$('input[name="bgTheme"][value="' + bgTheme + '"]')
			.parent()
			.click();
		$("input[name='bgTheme']").on('change', setTheme).trigger('change');
		// BG Color
		$('#bgColor')
			.val(bgColor)
			.on('change', (e) => {
				$('body').css({ backgroundColor: $(e.target).val() });
				try {
					// broadcasting
					flayWebsocket.info('bgcolor');
				} catch (e) {}
				LocalStorageItem.set('flay.bgcolor', $(e.target).val());
			})
			.trigger('change');
	},
	startLifeTimer() {
		$('#lifeTimerWrapper').lifeTimer({
			progress: false,
			pattern: 'day Days',
			onlyOnce: true,
		});
	},
	specialViewPause: false,
	specialView: () => {
		if (Security.isAutomaticallyCertificated()) {
			let selectedBgIndex = -1;
			$('#mainMenuWrap > li > div > a:nth-child(1)').hover(
				() => {
					if (SlideMenu.specialViewPause) {
						return;
					}
					selectedBgIndex = Random.getInteger(0, Background.count);
					$('#specialView').css({
						backgroundImage: "url('/static/image/" + selectedBgIndex + "')",
					});
				},
				() => {},
			);
			$('.sidenav > h4 > a').hover(
				() => {
					if (SlideMenu.specialViewPause) {
						return;
					}
					$('#specialView').css('backgroundImage', '');
				},
				() => {},
			);
			$('.sidenav > h4 > img').on('click', () => {
				Popup.imageByNo(selectedBgIndex);
			});
		} else {
			$('#specialView').hide();
		}
	},
};

const Background = {
	imageIndexArray: [],
	bgInterval: null,
	count: 0,
	paneWidth: LocalStorageItem.getInteger('flay.background-image.paneWidth', 400),
	intervalTime: 3000,
	init: () => {
		Rest.Image.size((count) => {
			Background.count = count;
		});
		Background.event();
	},
	event: () => {
		const paneResize = () => {
			let addedPaneLength = Math.round($(window).width() / Background.paneWidth) - $('#background_images div.col').length;
			if (addedPaneLength > 0) {
				for (let i = 0; i < addedPaneLength; i++) {
					$('<div>', { class: 'col' }).appendTo($('#background_images'));
				}
			} else {
				for (; addedPaneLength < 0; addedPaneLength++) {
					$('#background_images div.col:last-child').remove();
				}
			}
			$('#background_images img').css({ height: '' });
		};
		paneResize();
		$(window).on('resize', paneResize);
		// paneWidth
		$('#paneWidth')
			.on('change', (e) => {
				Background.paneWidth = parseInt($(e.target).val(), 10);
				paneResize();
				LocalStorageItem.set('flay.background-image.paneWidth', Background.paneWidth);
			})
			.val(Background.paneWidth);
		// Picture switch
		$('#bgFlow').on('change', (e) => {
			if ($(e.target).prop('checked')) {
				Background.start();
			} else {
				Background.stop();
			}
		});
		const backgroundImageShow = LocalStorageItem.getBoolean('flay.background-image', true);
		if (backgroundImageShow) $('#bgFlow').parent().click();
		// Picture fall down
		$('#pictureFalldown').on('click', () => {
			for (let i = 0; i < 20; i++) {
				Background.func();
			}
		});
	},
	start: () => {
		Background.bgInterval = setInterval(Background.func, Background.intervalTime);
		LocalStorageItem.set('flay.background-image', true);
	},
	stop: () => {
		clearInterval(Background.bgInterval);
		LocalStorageItem.set('flay.background-image', false);
	},
	func: () => {
		// make image index array
		if (Background.imageIndexArray.length === 0) {
			Background.imageIndexArray = Array.apply(null, { length: Background.count }).map(Number.call, Number);
			console.info('image array reset', Background.imageIndexArray.length);
		}
		// determine image index
		const imageIndex = Background.imageIndexArray.splice(Random.getInteger(0, Background.imageIndexArray.length - 1), 1);
		if ($.isEmptyObject(imageIndex)) {
			console.warn('imageIndex is empty', Background.imageIndexArray.length, imageIndex);
			return;
		}
		// select image pane
		const paneLength = $('#background_images div.col').length;
		const $imageWrap = $('#background_images div.col:nth-child(' + Random.getInteger(1, paneLength) + ')');
		// load image
		const image = new Image();
		image.onload = () => {
			// calculate size
			const calcImgWidth = parseInt($imageWrap.width(), 10);
			const calcImgHeight = parseInt((calcImgWidth * image.naturalHeight) / image.naturalWidth, 10);
			// create and append jquery image
			const $thisImage = $(image)
				.css({ height: 0 })
				.on('click', () => {
					Popup.imageByNo(imageIndex);
				})
				.prependTo($imageWrap);
			// showing
			setTimeout(() => {
				$thisImage.css({
					height: calcImgHeight,
				});
			}, 100);
		};
		image.src = PATH + '/static/image/' + imageIndex;
		// overflow image remove
		$imageWrap.children().each((index, image) => {
			const imageTop = $(image).position().top;
			const bgHeight = $('#background_images').height();
			if (imageTop > bgHeight) {
				$(image).remove();
			}
		});
	},
};

let isAdmin, username;

$(document).ready(() => {
	isAdmin = Security.hasRole('ADMIN');
	username = Security.getName();
	console.info(`User is ${username} ${isAdmin ? 'has ADMIN Role' : ''}`);

	Background.init();
	SlideMenu.init();
});

window.onerror = (e) => {
	if (e.toString() === 'ResizeObserver loop limit exceeded') {
		return;
	} else {
		loading.error('Error: ' + e);
	}
	console.error('Error name[' + e.name + '] message[' + e.message + '] toString[' + e?.toString() + ']', e);
};
