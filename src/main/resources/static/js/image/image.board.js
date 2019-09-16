/**
 * image.board.js
 */

$(function() {
	var totalCount = 0;
	var currIndex  = 0;
	var bgIntervalTime = LocalStorageItem.getInteger("image.board.bgIntervalTime", 10);
	var bgInterval;
	var pause = false;
	var tile   = LocalStorageItem.getBoolean("image.board.tile",   false);
	var random = LocalStorageItem.getBoolean("image.board.random", false);
	var rotate = LocalStorageItem.getBoolean("image.board.rotate", false);
	var DISPLAY_WIDTH_COUNT = 4;
	var DISPLAY_HEIGHT_COUNT = 5;
	var DISPLAY_COUNT = DISPLAY_WIDTH_COUNT * DISPLAY_HEIGHT_COUNT + 1;
	var displaySequence = 0;
	var POSITION_OFFSET = 100;
	var ROTATE_LIMIT = 10;

	var $imageWrap = $("#imageWrap");
	var $controlBox = $("#controlBox");
	var $progress = $("#paginationProgress > .progress-bar");

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
			shuffle();
			break;
		}
	});

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
		$("#imgTitle").html(imgInfo.name);
		$("#imgSize").html(image.naturalWidth + ' x ' + image.naturalHeight);
		$("#imgLength").html(File.formatSize(imgInfo.length));
		$("#imgModified").html(new Date(imgInfo.modified).format('yyyy-MM-dd'));
		$("#currNo").val(currIndex);
	}).on('notice', function(e, msg) {
		var $span = $("<span>", {class: 'msgBox'}).html(msg).appendTo($("#notice"));
		setTimeout(function() {
			$span.hide('blind', {direction: 'right'}, 500, function() {
				$(this).remove();
			});
		}, 1500);
	}).on('click', '#imgPath', function() {
		Rest.Flay.openFolder($(this).data("path"));
		$controlBox.trigger('notice', 'open folder: ' + $(this).data("path"));
	}).on('click', '#imgTitle', function() {
		Popup.imageByNo(currIndex);
		$controlBox.trigger('notice', 'pupup image: ' + currIndex);
	}).on('keyup', '#bgIntervalTime', function(e) {
		e.stopPropagation();
		if (e.keyCode === 13) {
			bgIntervalTime = parseInt($(this).val().replace(/[^0-9]/g, ''));
			LocalStorageItem.set("image.board.bgIntervalTime", bgIntervalTime);
			$controlBox.trigger('notice', 'set interval ' + bgIntervalTime + 's');
			view();
		}
	}).on('click', '#pause', function() {
		pause = $(this).toggleClass("active").hasClass("active");
		$controlBox.trigger('notice', 'slide pause: ' + pause);
		view();
	}).on('click', '#random', function() {
		random = $(this).toggleClass("active").hasClass("active");
		LocalStorageItem.set("image.board.random", random);
		$controlBox.trigger('notice', 'slide random: ' + random);
	}).on('click', '#rotate', function() {
		rotate = $(this).toggleClass("active").hasClass("active");
		LocalStorageItem.set("image.board.rotate", rotate);
		$controlBox.trigger('notice', 'rotate: ' + rotate);
		setRotate();
	}).on('click', '#tile', function() {
		tile = $(this).toggleClass("active").hasClass("active");
		LocalStorageItem.set("image.board.tile", tile);
		$controlBox.trigger('notice', 'tile mode: ' + tile);
		setPosition();
	}).on('keyup', '#currNo', function(e) {
		e.stopPropagation();
		if (e.keyCode === 13) {
			control.jump(parseInt($(this).val().replace(/[^0-9]/g, '')));
			$controlBox.trigger('notice', 'go slide: ' + currIndex);
		}
	});

	$progress.on('progress', function() {
		$(this).css({
			width: ((currIndex + 1) / totalCount * 100).toFixed(1) + "%"
		});
	});

	var control = {
			jump: function(idx) {
				currIndex = idx;
				view();
			},
			random: function() {
				currIndex = Random.getInteger(0, totalCount);
				view();
			},
			prev: function() {
				currIndex--;
				back();
			},
			next: function() {
				currIndex++;
				view();
			}
	};

	var back = function() {
		$imageWrap.children(":last-child").remove();
		if ($imageWrap.children(":last-child").length > 0) {
			var lastImgData = $imageWrap.children(":last-child").addClass("active").data("data");
			currIndex = lastImgData.index;
			$controlBox.trigger('setInfo', [lastImgData.self, lastImgData.info]);
		}
	};
	
	var shuffle = function() {
		if (!tile) {
			$imageWrap.children().each(function(idx) {
				var imgData = $(this).data("data");
				var imgTop  = Random.getInteger(0 - POSITION_OFFSET, window.innerHeight - $(this).height() + POSITION_OFFSET);
				var imgLeft = Random.getInteger(0 - POSITION_OFFSET, window.innerWidth  - $(this).width()  + POSITION_OFFSET);
				// console.log(idx, imgTop, imgLeft);
				$(this).css({
					top: imgTop,
					left: imgLeft,
				});
				imgData.top = imgTop;
				imgData.left = imgLeft;
			});
			$imageWrap.children(':nth-child(' + Random.getInteger(0, $imageWrap.children().length) + ')').click();
		} else {
			setPosition();
		}
	};
	
	var setPosition = function() {
		$imageWrap.children().each(function(idx) {
			var data = $(this).data("data");
			var displaySeq = data.displaySeq % 20;
			if (tile) {
				$(this).addClass("tile").css({
					top: Math.floor(displaySeq / DISPLAY_WIDTH_COUNT) * (window.innerHeight / DISPLAY_HEIGHT_COUNT),
					left: (displaySeq % DISPLAY_WIDTH_COUNT) * (window.innerWidth / DISPLAY_WIDTH_COUNT),
//					width: 'initial',
//					height: window.innerHeight / DISPLAY_HEIGHT_COUNT - 16,
//					maxWidth: window.innerWidth / DISPLAY_WIDTH_COUNT - 16,
				});
				if (data.self.naturalHeight > data.self.naturalWidth) {
					$(this).css({
						width: 'initial',
						height: window.innerHeight / DISPLAY_HEIGHT_COUNT - 16,
						maxWidth: window.innerWidth / DISPLAY_WIDTH_COUNT - 16,
					});
				} else {
					$(this).css({
						width: window.innerWidth / DISPLAY_WIDTH_COUNT - 16,
						height: 'initial',
						maxHeight: window.innerHeight / DISPLAY_HEIGHT_COUNT - 16
					});
				}
			} else {
				$(this).removeClass("tile").css({
					top: data.top,
					left: data.left,
					width: data.width,
					height: data.height
				});
			}
		});
	};
	
	var setRotate = function() {
		$imageWrap.children().each(function(idx) {
			var degree = rotate ? Random.getInteger(ROTATE_LIMIT * -1, ROTATE_LIMIT) : 0;
			$(this).css({
				transform: 'rotate(' + degree + 'deg)'
			});
		});
	};

	var imageAppearance = function($img) {
		var _data = $img.data("data");
		$img.css({
			top: data.top,
			left: data.left,
			width: data.width,
			height: data.height,
			maxWidth: data.maxWidth,
			maxHeight: data.maxHeight,
			transform: 'rotate(' + data.rotate + 'deg)'
		});
	};
	
	var view = function() {
		function show() {
			if (pause) {
				return;
			}
			// decision current index
			if (random) {
				currIndex = Random.getInteger(0, totalCount);
			} else {
				if (currIndex >= totalCount) {
					currIndex = 0;
				} else if (currIndex < 0) {
					currIndex = totalCount - 1;
				}
			}

			// old picture remove
			if ($imageWrap.children().length >= DISPLAY_COUNT) {
				$imageWrap.children(":first-child").remove();
			}

			$imageWrap.children().removeClass("active").draggable("disable");
			setPosition();

			// get info
			Rest.Image.get(currIndex, function(info) {
				// get Image
				var image = new Image();
				image.onload = function() {
					var _self = this;
					var imgTop = 0,
						imgLeft = 0,
						imgWidth = 0,
						imgHeight = 0,
						factor = 1.0, 
						degree = rotate ? Random.getInteger(ROTATE_LIMIT * -1, ROTATE_LIMIT) : 0;

					// determine size factor
					if (window.innerHeight < _self.naturalHeight || window.innerWidth < _self.naturalWidth) {
						factor = Math.min(window.innerHeight / _self.naturalHeight, window.innerWidth / _self.naturalWidth).toFixed(2);
						if (factor > 0.1) {
							factor -= 0.1;
						}
					}
					imgHeight = _self.naturalHeight * factor;
					imgWidth  = _self.naturalWidth  * factor;
					imgTop  = Random.getInteger(0 - POSITION_OFFSET, window.innerHeight - imgHeight + POSITION_OFFSET);
					imgLeft = Random.getInteger(0 - POSITION_OFFSET, window.innerWidth  - imgWidth  + POSITION_OFFSET);
					// console.log("factor", factor, "imgTop", imgTop, "imgLeft", imgLeft, "imgWidth", imgWidth, "imgHeight", imgHeight,  "degree", degree);
					
					var $img = $("<img>", {src: _self.src, class: 'board-image active'}).css({
						top: imgTop,
						left: imgLeft,
						width: imgWidth,
						height: imgHeight,
						opacity: 0
					}).data("data", {
						degree: degree,
						index: currIndex,
						self: _self,
						info: info,
						displaySeq: displaySequence++,
						top: imgTop,
						left: imgLeft,
						width: imgWidth,
						height: imgHeight,
					}).appendTo($imageWrap).animate({
						opacity: 1
					}, 300, function() {
						$(this).css({
							transform: 'rotate(' + degree + 'deg)'
						});
					}).on("click", function() {
						// console.log("click", $(this).next().length);
						if ($(this).next().length > 0) {
							$imageWrap.children().removeClass("active").draggable("disable");
							setPosition();

							var data = $(this).data("data");
							$(this).appendTo($imageWrap).animate({
								opacity: 1
							}, 100, function() {
								$(this).removeClass("tile").css({
									top: data.top,
									left: data.left,
									width: data.width,
									height: data.height,
									maxWidth: 'initial',
									minWidth: 'initial',
									transform: 'rotate(' + (rotate ? Random.getInteger(ROTATE_LIMIT * -1, ROTATE_LIMIT) : 0) + 'deg)'
								}).addClass("active");
							}).draggable("enable");
							
							currIndex = data.index;
							$controlBox.trigger('setInfo', [data.self, data.info]);
						}
					}).dblclick(function() {
						// console.log("dblclick");
						var data = $(this).data("data");
						Popup.imageByNo(data.index);
					}).draggable({
						stop: function(event, ui) {
							// console.log(event, ui);
							var _data = $(event.target).data("data");
							_data.top = ui.position.top;
							_data.left = ui.position.left;
						}
					});
					
					$progress.trigger('progress');

					$controlBox.trigger('setInfo', [_self, info]);
				};
				image.src = PATH + "/static/image/" + currIndex;

			});
			
		}

		clearInterval(bgInterval);
		show();
		if (!pause) {
			bgInterval = setInterval(function() {
				currIndex++;
				show();
			}, 1000 * bgIntervalTime);
			// console.log('setInterval', bgIntervalTime);
		}
	};

	$controlBox.trigger('init');

	control.random();

	$("body").toggleClass("bg-dark", LocalStorageItem.get('flay.bgtheme', 'D') === 'D').css({backgroundColor: LocalStorageItem.get('flay.bgcolor')});
});
