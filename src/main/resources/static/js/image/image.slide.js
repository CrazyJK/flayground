/**
 * image.slide.js
 */

$(function() {
	var totalCount = 0;
	var currIndex  = 0;
	var bgIntervalTime = LocalStorageItem.getInteger("image.slide.bgIntervalTime", 10);
	var bgInterval;
	var bgSizeProperties = ['contain', 'cover', 'auto'];
	var bgSizePropertiesIndex = LocalStorageItem.getInteger("image.slide.bgSizePropertiesIndex", 0);
	var pause = false;

	var $image = $("#imageWrap");
	var $controlBox = $("#controlBox");
	var $progress = $("#paginationProgress > .progress-bar");

	$image.navEvent(function(signal, e) {
		console.log('e.keyCode', signal);
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
		case 1002: // mouse middle click
			$controlBox.trigger('bgMode');
			break;
		}
	});

	$controlBox.on('init', function() {
		console.log('$controlBox init');
		Rest.Image.size(function(count) {
			totalCount = count;
			$("#totalNo").html(totalCount);
		});
		bgSizePropertiesIndex--;
		$controlBox.trigger('bgMode');
		$("#bgIntervalTime").val(bgIntervalTime);
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
	}).on('bgMode', function() {
		var bgSize = bgSizeProperties[++bgSizePropertiesIndex % bgSizeProperties.length];
		$image.css("backgroundSize", bgSize);
		$("#bgMode").html(bgSize);
		LocalStorageItem.set("image.slide.bgSizePropertiesIndex", bgSizePropertiesIndex);
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
			LocalStorageItem.set("image.slide.bgIntervalTime", bgIntervalTime);
			$controlBox.trigger('notice', 'set interval ' + bgIntervalTime + 's');
			view();
		}
	}).on('click', '#pause', function() {
		pause = $(this).toggleClass("active").hasClass("active");
		$controlBox.trigger('notice', 'slide pause: ' + pause);
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
				view();
			},
			next: function() {
				currIndex++;
				view();
			}
	};

	var view = function() {
		function show() {
			if (currIndex >= totalCount) {
				currIndex = 0;
			} else if (currIndex < 0) {
				currIndex = totalCount - 1;
			}
//			console.log('image.show', currIndex);

			var image = new Image();
			image.onload = function() {
				var _self = this;
				$image.css({
					backgroundImage: 'url(' + _self.src + ')'
				});
				$progress.trigger('progress');

				// get info
				Rest.Image.get(currIndex, function(info) {
					$controlBox.trigger('setInfo', [_self, info]);
				});
			};
			image.src = PATH + "/static/image/" + currIndex;
//			console.log('image.src', PATH, "/static/image/", currIndex);
		}

		clearInterval(bgInterval);
		show();
		if (!pause) {
			bgInterval = setInterval(function() {
				currIndex++;
				show();
			}, 1000 * bgIntervalTime);
			console.log('setInterval', bgIntervalTime);
		}
	};

	$controlBox.trigger('init');
	control.random();

});
