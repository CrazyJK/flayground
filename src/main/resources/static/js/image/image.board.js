/**
 * image.board.js
 */

$(function() {
	var totalCount = 0;
	var lastIndex = 0;
	var bgIntervalTime = LocalStorageItem.getInteger("image.board.bgIntervalTime", 10);
	var bgInterval;
	var pause  = false;
	var tile   = LocalStorageItem.getBoolean("image.board.tile",   false);
	var random = LocalStorageItem.getBoolean("image.board.random", false);
	var rotate = LocalStorageItem.getBoolean("image.board.rotate", false);
	var x = 5, y = 4;
	var TILE = {
			col: x,
			row: y,
			margin: 8,
			width: 0,
			height: 0,
			inner: {
				width: 0,
				height: 0
			},
			ratio: 0
	};
	var POSITION_MARGIN = 100;
	var ROTATE_LIMIT = 10;
	var displaySequence = 0;

	var $imageWrap  = $("#imageWrap");
	var $controlBox = $("#controlBox");
	var $progress   = $("#paginationProgress > .progress-bar");

	$imageWrap.navEvent(function(signal, e) {
		// console.log('e.keyCode', signal);
		switch (signal) {
		case 32: // key space
			control.random();
			break;
		case 37: // key left
		case 1: // mousewheel up
			control.prev();
			break;
		case 39: // right
		case -1: // mousewheel down
			control.next();
			break;
		case 1001: // mouse left click
			break;
		case 1002: // mouse middle click
			control.shuffle();
			break;
		}
	});

	$(window).on("resize", function() {
		TILE.col = window.innerWidth > window.innerHeight ? x : y;
		TILE.row = window.innerWidth > window.innerHeight ? y : x;
	}).trigger("resize");
	
	$controlBox.on('init', function() {
		// console.log('$controlBox init');
		Rest.Image.size(function(count) {
			totalCount = count;
			$("#totalNo").html(totalCount);
		});
		$("#bgIntervalTime").val(bgIntervalTime);

		$('#tile').toggleClass("active", tile);
		$('#random').toggleClass("active", random);
		$('#rotate').toggleClass("active", rotate);

	}).on('setInfo', function(e, image, imgInfo) {
		$("#imgPath").html(imgInfo.path.replace(/\\/gi, '/').split('/').pop()).data("path", imgInfo.path);
		$("#imgTitle").html(imgInfo.name).data("idx", imgInfo.idx);
		$("#imgSize").html(image.naturalWidth + ' x ' + image.naturalHeight);
		$("#imgLength").html(File.formatSize(imgInfo.length));
		$("#imgModified").html(new Date(imgInfo.modified).format('yyyy-MM-dd'));
		$("#currNo").val(imgInfo.idx);
		$progress.css({
			width: ((imgInfo.idx + 1) / totalCount * 100).toFixed(1) + "%"
		});
		$("#infoMsg").html(displaySequence);
	}).on('notice', function(e, msg) {
		var $span = $("<span>", {class: 'msgBox'}).html(msg).appendTo($("#notice"));
		setTimeout(function() {
			$span.hide('blind', {direction: 'down'}, 300, function() {
				$(this).remove();
			});
		}, 1500);
	}).on('click', '#imgPath', function() {
		Rest.Flay.openFolder($(this).data("path"));
		$controlBox.trigger('notice', 'open folder: ' + $(this).data("path"));
	}).on('click', '#imgTitle', function() {
		var clickedImageIndex = parseInt($(this).data("idx"));
		Popup.imageByNo(clickedImageIndex);
		$controlBox.trigger('notice', 'pupup image: ' + clickedImageIndex);
	}).on('keyup', '#bgIntervalTime', function(e) {
		e.stopPropagation();
		if (e.keyCode === 13) {
			bgIntervalTime = parseInt($(this).val().replace(/[^0-9]/g, ''));
			LocalStorageItem.set("image.board.bgIntervalTime", bgIntervalTime);
			$controlBox.trigger('notice', 'set interval ' + bgIntervalTime + 's');
			control.next();
		}
	}).on('click', '#pause', function() {
		pause = $(this).toggleClass("active").hasClass("active");
		$controlBox.trigger('notice', 'slide pause: ' + pause);
		control.next();
	}).on('click', '#random', function() {
		random = $(this).toggleClass("active").hasClass("active");
		LocalStorageItem.set("image.board.random", random);
		$controlBox.trigger('notice', 'slide random: ' + random);
	}).on('click', '#rotate', function() {
		rotate = $(this).toggleClass("active").hasClass("active");
		LocalStorageItem.set("image.board.rotate", rotate);
		$controlBox.trigger('notice', 'rotate: ' + rotate);
		toggleRotate();
	}).on('click', '#tile', function() {
		tile = $(this).toggleClass("active").hasClass("active");
		LocalStorageItem.set("image.board.tile", tile);
		$controlBox.trigger('notice', 'tile mode: ' + tile);
		toggleTile();
	}).on('keyup', '#currNo', function(e) {
		e.stopPropagation();
		if (e.keyCode === 13) {
			var wantedImageIndex = parseInt($(this).val().replace(/[^0-9]/g, ''));
			control.jump(wantedImageIndex);
			$controlBox.trigger('notice', 'go slide: ' + wantedImageIndex);
		}
	});

	var control = {
			jump: function(idx) {
				view(idx, true);
			},
			random: function() {
				view(Random.getInteger(0, totalCount));
			},
			next: function() {
				view(parseInt($("#currNo").val()) + 1);
			},
			prev: function() { // delete last image
				$imageWrap.children(":last-child").remove();
				if ($imageWrap.children(":last-child").length > 0) {
					var lastImgData = $imageWrap.children(":last-child").addClass("active").data("data");
					$controlBox.trigger('setInfo', [lastImgData.image, lastImgData.info]);
				}
			},
			shuffle: function() {
				if (tile) {
					toggleTile();
				} else {
					$imageWrap.children().each(function(idx) {
						var imgData = $(this).data("data");
						imgData.css = getImageExteriorCss(imgData.image);
						$(this).css(imgData.css);
					});
					$imageWrap.children(':nth-child(' + Random.getInteger(0, $imageWrap.children().length) + ')').click();
				}
			}
	};

	var toggleTile = function() {
		TILE.width  = Math.round(window.innerWidth  / TILE.col);
		TILE.height = Math.round(window.innerHeight / TILE.row);
		TILE.inner.width  = TILE.width  - TILE.margin * 2;
		TILE.inner.height = TILE.height - TILE.margin * 2;
		TILE.ratio = TILE.inner.width / TILE.inner.height;
		// console.log("TILE", TILE);
		
		$imageWrap.children().each(function(idx) {
			var data = $(this).data("data");
			if (tile) {
				var displaySeq = data.displaySeq % (TILE.col * TILE.row);
				var imageRatio = data.image.naturalWidth / data.image.naturalHeight;
				var isHorizontal = imageRatio >= TILE.ratio;
				// console.log("image", displaySeq, imageRatio);
				$(this).addClass("tile").css({
					top: Math.floor(displaySeq / TILE.col) * TILE.height,
					left:          (displaySeq % TILE.col) * TILE.width,
					width:      isHorizontal ? TILE.inner.width : 'initial',
					height:     isHorizontal ? 'initial' : TILE.inner.height,
					marginTop:  isHorizontal ? (TILE.height - TILE.inner.width / imageRatio) / 2 : TILE.margin,
					marginLeft: isHorizontal ? TILE.margin : (TILE.width - TILE.inner.height * imageRatio) / 2
				});
			} else {
				$(this).removeClass("tile").css(data.css);
			}
		});
	};
	
	var toggleRotate = function() {
		$imageWrap.children().each(function(idx) {
			$(this).css({
				transform: 'rotate(' + (rotate ? Random.getInteger(ROTATE_LIMIT * -1, ROTATE_LIMIT) : 0) + 'deg)'
			});
		});
	};

	var setPreviousImage = function() {
		$imageWrap.children().removeClass("active").addClass("prev");
		toggleTile();
	}
	
	var getImageExteriorCss = function(image) {
		var factor = 1.0; // determine size factor
		if (window.innerHeight < image.naturalHeight || window.innerWidth < image.naturalWidth) {
			factor = Math.min(window.innerHeight / image.naturalHeight, window.innerWidth / image.naturalWidth).toFixed(2);
			if (factor > 0.1) {
				factor -= 0.1;
			}
		}
		var imgHeight = image.naturalHeight * factor;
		var imgWidth  = image.naturalWidth  * factor;
		var imgTop  = Random.getInteger(0 - POSITION_MARGIN, window.innerHeight - imgHeight + POSITION_MARGIN);
		var imgLeft = Random.getInteger(0 - POSITION_MARGIN, window.innerWidth  - imgWidth  + POSITION_MARGIN);
		var degree = rotate ? Random.getInteger(ROTATE_LIMIT * -1, ROTATE_LIMIT) : 0;
		return {
			top: imgTop,
			left: imgLeft,
			width: imgWidth,
			height: imgHeight,
			opacity: 1,
			transform: 'rotate(' + degree + 'deg)'
		};
	};
	
	var view = function(reqIndex, fixed) {
		function show() {
			if (pause) {
				return;
			}
			// Stop nav event
			$imageWrap.navActive(false);

			// decision current index
			if (random) {
				reqIndex = Random.getInteger(0, totalCount);
			} else {
				if (!fixed && reqIndex <= lastIndex) {
					reqIndex = lastIndex + 1;
				}
				if (reqIndex >= totalCount) {
					reqIndex = 0;
				} else if (reqIndex < 0) {
					reqIndex = totalCount - 1;
				}
			}
			lastIndex = reqIndex;

			// old picture remove
			if ($imageWrap.children().length >= TILE.row * TILE.col + 1) {
				$imageWrap.children(":first-child").remove();
			}

			setPreviousImage();

			// get info
			Rest.Image.get(reqIndex, function(info) {
				// load Image
				var image = new Image();
				image.onload = function() {
					var _self = this;
					// console.log(_self, info);

					// decide css
					var decisionCss = getImageExteriorCss(_self);
					var initialCss = $.extend({}, decisionCss, {
						opacity: 0,
						transform: 'scale(1.1) rotate(0deg)'
					});

					var $img = $("<img>", {src: _self.src, class: 'board-image active'}).css(initialCss).data("data", {
						displaySeq: displaySequence++,
						image: _self,
						info: info,
						css: decisionCss
					}).appendTo($imageWrap).animate({
						opacity: 1
					}, 300, function() {
						$(this).css(decisionCss);
						// Start nav event
						$imageWrap.navActive(true);
					}).on("click", function() {
						// console.log("click", $(this).next().length);
						if ($(this).next().length > 0) { // 중간에서 선택
							setPreviousImage();
						}
						
						var data = $(this).data("data");
						$(this).appendTo($imageWrap).animate({
							opacity: 1
						}, 100, function() {
							$(this).removeClass("tile prev").addClass("active").css(data.css);
						});
						
						$controlBox.trigger('setInfo', [data.image, data.info]);

					}).dblclick(function() {
						// console.log("dblclick");
						var data = $(this).data("data");
						Popup.imageByNo(data.info.idx);
					}).draggable({
						cancel: ".prev",
						stop: function(event, ui) {
							// console.log(event, ui);
							var data = $(event.target).data("data");
							data.css.top  = ui.position.top;
							data.css.left = ui.position.left;
						}
					});

					// set info
					LocalStorageItem.set("image.board.index", reqIndex);
					$controlBox.trigger('setInfo', [_self, info]);
				};
				image.src = PATH + "/static/image/" + reqIndex;
			});
		}

		clearInterval(bgInterval);
		show();
		if (!pause) {
			bgInterval = setInterval(function() {
				control.next();
			}, 1000 * bgIntervalTime);
		}
	};

	$controlBox.trigger('init');

	control.jump(LocalStorageItem.getInteger("image.board.index", 0));

	$("body").toggleClass("bg-dark", LocalStorageItem.get('flay.bgtheme', 'D') === 'D').css({backgroundColor: LocalStorageItem.get('flay.bgcolor')});
});
