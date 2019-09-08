/**
 * image.board.js
 */

$(function() {
	var totalCount = 0;
	var currIndex  = 0;
	var bgIntervalTime = LocalStorageItem.getInteger("image.board.bgIntervalTime", 10);
	var bgInterval;
	var pause = false;
	var random = LocalStorageItem.getBoolean("image.board.random", false);
	var rotate = LocalStorageItem.getBoolean("image.board.rotate", false);
	var DISPLAY_COUNT = 20;
	var POSITION_OFFSET = 100;

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
		view();
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

			$imageWrap.children().removeClass("active");
			
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
						degree = rotate ? Random.getInteger(-10, 10) : 0;

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
						position: "fixed",
						top: imgTop,
						left: imgLeft,
						width: imgWidth,
						height: imgHeight,
						opacity: 0
					}).data("data", {
						rotate: degree,
						index: currIndex,
						self: _self,
						info: info
					}).appendTo($imageWrap).animate({
						opacity: 1
					}, 300, function() {
						$(this).css({
							transform: 'rotate(' + degree + 'deg)'
						});
					}).on("click", function() {
						// console.log("click", $(this).next().length);
						if ($(this).next().length > 0) {
							$imageWrap.children().removeClass("active");
							var data = $(this).data("data");
							$(this).appendTo($imageWrap).animate({
								opacity: 1
							}, 100, function() {
								$(this).css({
									transform: 'rotate(' + (rotate ? Random.getInteger(-10, 10) : 0) + 'deg)'
								}).addClass("active");
							});
							$controlBox.trigger('setInfo', [data.self, data.info]);
						}
					}).dblclick(function() {
						// console.log("dblclick");
						var data = $(this).data("data");
						Popup.imageByNo(data.index);
					});
					
					$progress.trigger('progress');

					$controlBox.trigger('setInfo', [_self, info]);

					// old picture remove
					if ($imageWrap.children().length > DISPLAY_COUNT) {
						$imageWrap.children(":first-child").remove();
					}
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
