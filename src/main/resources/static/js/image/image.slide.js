/**
 * image.slide.js
 */


$(function() {
	var totalCount = 0;
	var currIndex  = 0;
	var bgInterval;
	var bgIntervalTime = LocalStorageItem.getInteger("image.slide.bgIntervalTime", 10);
	var bgSizeProperties = ['contain', 'cover', 'auto'];
	var bgSizePropertiesIndex = -1;
	var $image = $("#imageWrap");
	var $pageProgress = $("#paginationProgress .progress-bar");
	var $totalNo = $("#totalNo");
	var $currNo = $("#currNo");
	var $bgIntervalTime = $("#bgIntervalTime");
	var $imgPath = $("#imgPath");
	var $imgTitle = $("#imgTitle");
	var $imgSize = $("#imgSize");
	var $imgLength = $("#imgLength");
	var $imgModified = $("#imgModified");
	var $bgMode = $("#bgMode");
	var $pause = $("#pause");
	var pause = false;

	// setTotalCount
	Rest.Image.size(function(count) {
		totalCount = count;
		$totalNo.html(totalCount);

		// set currIndex by random 
		currIndex = Random.getInteger(0, totalCount);
	});

	function cssChangeBackgroundSize() {
		$image.css({
			backgroundSize: bgSizeProperties[++bgSizePropertiesIndex % 3]
		});
		$bgMode.html(bgSizeProperties[bgSizePropertiesIndex % 3]);
	}
	cssChangeBackgroundSize();

	// navigate
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
		case 1002:
			cssChangeBackgroundSize();
			break;
		}
	});
	
	// new index
	$currNo.on("keyup", function(e) {
	    e.stopPropagation();
		if (e.keyCode === 13) {
			control.jump(parseInt($(this).val().replace(/[^0-9]/g, '')));
		}
	});
	
	// new interval time
	$bgIntervalTime.on("keyup", function(e) {
	    e.stopPropagation();
		if (e.keyCode === 13) {
			bgIntervalTime = parseInt($(this).val().replace(/[^0-9]/g, ''));
			LocalStorageItem.set("image.slide.bgIntervalTime", bgIntervalTime);
			view();
			$("#notice").html('set interval ' + bgIntervalTime + 's');
			setTimeout(function() {
				$("#notice").html('');
			}, 1500);
		}
	}).val(bgIntervalTime + "s");
	
	// open explorer
	$imgPath.on("click", function() {
		Rest.Flay.openFolder($(this).data("path"));
	}).css("cursor", "pointer");
	
	// popup image
	$imgTitle.on("click", function() {
		Popup.imageByNo(currIndex);
	}).css("cursor", "pointer");

	// slide pause
	$pause.on("click", function() {
		pause = $(this).toggleClass("active").hasClass("active");
		console.log('pause', pause);
		view();
	}).css("cursor", "pointer");
	
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
			console.log('image.show', currIndex);
			 
			var img = new Image();
			img.onload = function() {
				$image.css({
					backgroundImage: 'url(' + this.src + ')'
				});
				$pageProgress.css({
					width: ((currIndex + 1) / totalCount * 100).toFixed(1) + "%"
				});
				$currNo.val(currIndex);
				$imgSize.html(this.naturalWidth + ' x ' + this.naturalHeight);

				// get info
				Rest.Image.get(currIndex, function(imgInfo) {
					$imgPath.html(imgInfo.path.replace(/\\/gi, '/').split('/').pop()).data("path", imgInfo.path);
					$imgTitle.html(imgInfo.name);
					$imgLength.html(File.formatSize(imgInfo.length));
					$imgModified.html(new Date(imgInfo.modified).format('yyyy-MM-dd'));
				});
			};
			img.src = PATH + "/static/image/" + currIndex;
			console.log('img.src', PATH, "/static/image/", currIndex);
		}
		
		clearInterval(bgInterval);
		show();
		if (!pause) {
			bgInterval = setInterval(function() {
				currIndex++;
				show();
			}, 1000 * bgIntervalTime);
			console.log('setInterval');
		}
	};

	view();

});
