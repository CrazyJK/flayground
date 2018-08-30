var agent = navigator.userAgent.toLowerCase(),
	MSIE    = 'MSIE',
	EDGE    = 'Edge',
	CHROME  = 'Chrome',
	FIREFOX = 'Firefox',
	SAFARI  = 'Safari',
	browser = /trident/i.test(agent) || /msie/i.test(agent) ? MSIE :
		/edge/i.test(agent) ? EDGE : 
			/chrome/i.test(agent) ? CHROME :
				/firefox/i.test(agent) ? FIREFOX :
					/safari/i.test(agent) ? SAFARI :'Unknown',
	WINDOWS = 'Windows',
	LINUX   = 'Linux',
	MAC     = 'Macintosh',
	IPHONE  = 'iPhone',
	IPAD    = 'iPad',
	ANDROID = 'Android',
	system = /Windows/i.test(agent) ? WINDOWS :
		/linux/i.test(agent) ? LINUX :
			/macintosh/i.test(agent) ? MAC :
				/iphone/i.test(agent) ? IPHONE :
					/ipad/i.test(agent) ? IPAD :
						/android/i.test(agent) ? ANDROID : 'Unknown',
	DEFAULT_SPECS = "toolbar=0,location=0,directories=0,titlebar=0,status=0,menubar=0,scrollbars=1,resizable=1",
	COVER_RATIO = 0.6625;

var popup = {
		/**
		 * 팝업창을 띄운다. 
		 * @param url
		 * @param name '-'글자는 ''으로 바뀜
		 * @param width if null, 화면 절반 크기
		 * @param height if null, 화면 절반 크기
		 * @param positionMethod if null, 화면 가운데. Mouse 마우스 위치. 
		 * @param specs if null, default is DEFAULT_SPECS
		 */
		open: function(url, name, width, height, positionMethod, specs, event) {
			//console.log("[popup] Call popup : ", url, name, width, height, positionMethod, specs, event);
			var windowScreenWidth  = window.screen.width,
				windowScreenHeight = window.screen.height;
			var	left, top;

			name = name.replace(/-/gi, '');
			width = width || windowScreenWidth / 2;
			height = height || windowScreenHeight / 2;
			
			if (positionMethod && positionMethod === 'Mouse') {
				left = event.screenX; 
				top  = event.screenY;
			} else {
				left = (windowScreenWidth  - width) / 2; 
				top  = (windowScreenHeight - height) / 2;
			}
			specs = "width=" + width + ",height=" + height + ",left=" + left + ",top=" + top + "," + (specs || DEFAULT_SPECS);

			var popupWindow = window.open(url, name, specs);
			if (popupWindow) {
				popupWindow.focus();
			}
		},
		image: function(url, name) {
			var img = new Image();
			img.onload = function() {
				popup.open(PATH + '/html/image/image.html?src=' + url, name || url, this.naturalWidth, this.naturalHeight);
			};
			img.src = url;
		},
		imageByNo: function(no, name) {
			var img = new Image();
			img.onload = function() {
				popup.open(PATH + '/html/image/image.html?p=' + PATH + '&no=' + no, name || 'image' + no, this.naturalWidth, this.naturalHeight);
			};
			img.src = PATH + '/image/' + no;
		}
};

var random = {
		get: function(start, end) {
			return Math.random() * (end - start) + start;
		},
		getInteger: function(start, end) { // start부터 end사이의 random 정수 반환
			return Math.round(this.get(start, end));
		},
		getHex: function(start, end) {
			return this.getInteger(start, end).toString(16);
		},
		getBoolean: function() {
			return this.getInteger(1, 2) === 1;
		},
		getFont: function(selectedFont) {
			var GOOGLE_FONTAPI = 'https://fonts.googleapis.com/css?family=',
			GOOGLE_WEBFONTS = ['clipregular', 'Bahiana', 'Barrio', 'Caveat Brush', 'Indie Flower', 'Lobster', 'Gloria Hallelujah', 'Pacifico', 'Shadows Into Light', 'Baloo', 'Dancing Script', 'VT323', 'Acme', 'Alex Brush', 'Allura', 'Amatic SC', 'Architects Daughter', 'Audiowide', 'Bad Script', 'Bangers', 'BenchNine', 'Boogaloo', 'Bubblegum Sans', 'Calligraffitti', 'Ceviche One', 'Chathura', 'Chewy', 'Cinzel', 'Comfortaa', 'Coming Soon', 'Cookie', 'Covered By Your Grace', 'Damion', 'Economica', 'Freckle Face', 'Gochi Hand', 'Great Vibes', 'Handlee', 'Homemade Apple', 'Josefin Slab', 'Just Another Hand', 'Kalam', 'Kaushan Script', 'Limelight', 'Lobster Two', 'Marck Script', 'Monoton', 'Neucha', 'Nothing You Could Do', 'Oleo Script', 'Orbitron', 'Pathway Gothic One', 'Patrick Hand', 'Permanent Marker', 'Pinyon Script', 'Playball', 'Poiret One', 'Rajdhani', 'Rancho', 'Reenie Beanie', 'Righteous', 'Rock Salt', 'Sacramento', 'Satisfy', 'Shadows Into Light Two', 'Source Code Pro', 'Special Elite', 'Tangerine', 'Teko', 'Ubuntu Mono', 'Unica One', 'Yellowtail', 'Aclonica', 'Aladin', 'Allan', 'Allerta Stencil', 'Annie Use Your Telescope', 'Arizonia', 'Berkshire Swash', 'Bilbo Swash Caps', 'Black Ops One', 'Bungee Inline', 'Bungee Shade', 'Cabin Sketch', 'Chelsea Market', 'Clicker Script', 'Crafty Girls', 'Creepster', 'Diplomata SC', 'Ewert', 'Fascinate Inline', 'Finger Paint', 'Fontdiner Swanky', 'Fredericka the Great', 'Frijole', 'Give You Glory', 'Grand Hotel', 'Hanuman', 'Herr Von Muellerhoff', 'Italianno', 'Just Me Again Down Here', 'Knewave', 'Kranky', 'Kristi', 'La Belle Aurore', 'Leckerli One', 'Life Savers', 'Love Ya Like A Sister', 'Loved by the King', 'Merienda', 'Merienda One', 'Modak', 'Montez', 'Mountains of Christmas', 'Mouse Memoirs', 'Mr Dafoe', 'Mr De Haviland', 'Norican', 'Oregano', 'Over the Rainbow', 'Parisienne', 'Petit Formal Script', 'Pompiere', 'Press Start 2P', 'Qwigley', 'Raleway Dots', 'Rochester', 'Rouge Script', 'Schoolbell', 'Seaweed Script', 'Slackey', 'Sue Ellen Francisco', 'The Girl Next Door', 'UnifrakturMaguntia', 'Unkempt', 'Waiting for the Sunrise', 'Walter Turncoat', 'Wire One', 'Yesteryear', 'Zeyada', 'Aguafina Script', 'Akronim', 'Averia Sans Libre', 'Bilbo', 'Bungee Hairline', 'Bungee Outline', 'Cedarville Cursive', 'Codystar', 'Condiment', 'Cormorant Upright', 'Dawning of a New Day', 'Delius Unicase', 'Dorsa', 'Dynalight', 'Eagle Lake', 'Engagement', 'Englebert', 'Euphoria Script', 'Faster One', 'Flamenco', 'Glass Antiqua', 'Griffy', 'Henny Penny', 'Irish Grover', 'Italiana', 'Jolly Lodger', 'Joti One', 'Julee', 'Kenia', 'Kite One', 'Kumar One Outline', 'League Script', 'Lemonada', 'Londrina Outline', 'Lovers Quarrel', 'Meddon', 'MedievalSharp', 'Medula One', 'Meie Script', 'Miniver', 'Molle:400i', 'Monofett', 'Monsieur La Doulaise', 'Montserrat Subrayada', 'Mrs Saint Delafield', 'Mystery Quest', 'New Rocker', 'Nosifer', 'Nova Mono', 'Piedra', 'Quintessential', 'Ribeye', 'Ruthie', 'Rye', 'Sail', 'Sancreek', 'Sarina', 'Snippet', 'Sofia', 'Stalemate', 'Sunshiney', 'Swanky and Moo Moo', 'Titan One', 'Trade Winds', 'Tulpen One', 'UnifrakturCook:700', 'Vampiro One', 'Vast Shadow', 'Vibur', 'Wallpoet', 'Almendra Display', 'Almendra SC', 'Arbutus', 'Astloch', 'Aubrey', 'Bigelow Rules', 'Bonbon', 'Butcherman', 'Butterfly Kids', 'Caesar Dressing', 'Devonshire', 'Diplomata', 'Dr Sugiyama', 'Eater', 'Elsie Swash Caps', 'Fascinate', 'Felipa', 'Flavors', 'Gorditas', 'Hanalei', 'Hanalei Fill', 'Jacques Francois Shadow', 'Jim Nightshade', 'Lakki Reddy', 'Londrina Shadow', 'Londrina Sketch', 'Macondo Swash Caps', 'Miltonian', 'Miltonian Tattoo', 'Miss Fajardose', 'Mr Bedfort', 'Mrs Sheppards', 'Nova Script', 'Original Surfer', 'Princess Sofia', 'Ravi Prakash', 'Ribeye Marrow', 'Risque', 'Romanesco', 'Ruge Boogie', 'Sevillana', 'Sirin Stencil', 'Smokum', 'Snowburst One', 'Underdog'],
			selectedFont = selectedFont || GOOGLE_WEBFONTS[this.getInteger(0, GOOGLE_WEBFONTS.length-1)];
			
			var link  = document.createElement('link');
		    link.rel  = 'stylesheet';
		    link.href = GOOGLE_FONTAPI + selectedFont;
		    document.getElementsByTagName('head')[0].appendChild(link);
		    return selectedFont;
		},
		getColor: function(alpha) {
			if (alpha)
				return "rgba(" + this.getInteger(0,255) + "," + this.getInteger(0,255) + "," + this.getInteger(0,255) + "," + (alpha === 'r' ? this.get(0, 1) : alpha) + ")";
			else
				return "#" + this.getHex(0, 255).zf(2) + this.getHex(0, 255).zf(2) + this.getHex(0, 255).zf(2);
		}
};

var localStorageItem = {
		set: function(itemName, itemValue) {
			typeof(Storage) !== "undefined" && localStorage.setItem(itemName, itemValue);
		},
		get: function(itemName, notfoundDefault) {
			return typeof(Storage) !== "undefined" && (localStorage.getItem(itemName) || notfoundDefault);
		},
		getInteger: function(itemName, notfoundDefault) {
			return parseInt(this.get(itemName, notfoundDefault));
		},
		getBoolean: function(itemName, notfoundDefault) {
			if (notfoundDefault) {
				return this.get(itemName, notfoundDefault.toString()) === 'true';
			} else {
				return this.get(itemName) === 'true';
			}
		}
};
	
var	reqParam = location.search.split(/[?&]/).slice(1).map(function(paramPair) {
	return paramPair.split(/=(.+)?/).slice(0, 2);
}).reduce(function(obj, pairArray) {
	obj[pairArray[0]] = pairArray[1];
	return obj;
}, {});

Date.prototype.format = function(f) { // http://stove99.tistory.com/46
    if (!this.valueOf()) return " ";
    
    var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var d = this;
     
    return f.replace(/(yyyy|yy|MM|dd|E|HH|hh|mm|ss|a\/p)/gi, function($1) {
        switch ($1) {
        case "yyyy": 
        	return d.getFullYear();
        case "yy": 
        	return (d.getFullYear() % 1000).zf(2);
        case "MM": 
        	return (d.getMonth() + 1).zf(2);
        case "dd":
        	return d.getDate().zf(2);
        case "E":
        	return weekName[d.getDay()];
        case "HH":
        	return d.getHours().zf(2);
        case "hh":
        	return ((h = d.getHours() % 12) ? h : 12).zf(2);
        case "mm":
        	return d.getMinutes().zf(2);
        case "ss":
        	return d.getSeconds().zf(2);
        case "a/p":
        	return d.getHours() < 12 ? "오전" : "오후";
        default:
        	return $1;
        }
    });
};
String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};

var formatFilesize = function(length) {
	var KB = 1024, MB = KB * KB, GB = MB * KB, TB = GB * KB;

	if (length < KB)
		return length + " B";
	else if (length < MB)
		return (length / KB).toFixed(0) + " kB";
	else if (length < GB)
		return (length / MB).toFixed(1) + " MB";
	else if (length < TB)
		return (length / GB).toFixed(2) + " GB";
	else
		return length;
};

var restCall = function(url, args, callback) {
	var DEFAULTS = {
			method: "GET",
			data: {},
			mimeType: "application/json",
			async: true,
//			beforeSend: function(xhr) {
//				xhr.setRequestHeader("Accept", "application/json");
//			},
			showLoading: true,
			title: "Call request"
	};
	var settings = $.extend({}, DEFAULTS, args);
	
	settings.showLoading && loading.on(settings.title);
	
	$.ajax(url, settings).done(function(data) {
		if (callback)
			callback(data);
		settings.showLoading && loading.off();
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.log("restCall fail", '\njqXHR=', jqXHR, '\ntextStatus=', textStatus, '\nerrorThrown=', errorThrown);
		var errMsg = "";
		if (jqXHR.getResponseHeader('error')) {
			errMsg = 'Message: ' + jqXHR.getResponseHeader('error.message') + "<br>" + 'Cause: ' + jqXHR.getResponseHeader('error.cause');
		} else if (jqXHR.responseJSON) {
			errMsg = 'Error: '     + jqXHR.responseJSON.error + '<br>' + 
					'Exception: ' + jqXHR.responseJSON.exception + '<br>' +
					'Message: '   + jqXHR.responseJSON.message + '<br>' +
					'Timestamp: ' + jqXHR.responseJSON.timestamp + '<br>' +
					'Status: '    + jqXHR.responseJSON.status + '<br>' + 
					'Path: '      + jqXHR.responseJSON.path;
		} else {
			errMsg = 'Error:<br>' + textStatus + "<br>" + errorThrown;
		}
		loading.on(errMsg);
	}).always(function(data_jqXHR, textStatus, jqXHR_errorThrown) {
	});
};

function Loading() {
	this.overlay = "#overlay";
	this.body = "#overlay > #overlay_body";
	$("html").on("click", this.overlay, function() {
		$(this).hide();
	});
};
Loading.prototype = {
		on: function(body) {
			$(this.body).append(body);
			$(this.overlay).show();
		},
		off: function() {
			$(this.body).empty();
			$(this.overlay).hide();
		}
};
var loading = new Loading();

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
			$("#bgOn").on("change", function() {
				$(this).prop("checked") ? background.start() : background.stop();
			});
		}
};

var background = {
		imageIndexArray: [],
		bgInterval: null,
		count: 0,
		init: function() {
			restCall(PATH + '/image/size', {}, function(count) {
				background.count = count;
			});
		},
		start: function() {
			background.bgInterval = setInterval(background.func, 3000);
		},
		stop: function() {
			clearInterval(background.bgInterval);
		},
		func: function(count) {
			// make image index array
			if (background.imageIndexArray.length === 0) {
				background.imageIndexArray = Array.apply(null, {length: background.count}).map(Number.call, Number);
			}
			// determine image index
			var imageIndex = background.imageIndexArray.splice(random.getInteger(0, background.imageIndexArray.length), 1);
			var $imageWrap = $("#image_pane_" + random.getInteger(0, 3));
			var image = new Image();
			image.onload = function() {
				// calculate size
				var calcImgWidth  = parseInt($imageWrap.width());
				var calcImgHeight = parseInt(calcImgWidth * this.naturalHeight / this.naturalWidth);
				// append new image
				$(this).css({height: 0}).addClass("rounded").prependTo($imageWrap).css({height: calcImgHeight}).on("click", function() {
					popup.imageByNo(imageIndex);
				});
			}
			image.src = PATH + "/image/" + imageIndex;
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

$(document).ready(function() {

	event.resize();
	event.togglePage();
	event.theme();
	event.bgToggle();
	
	loading.off();
	
	background.init();
	background.start();
	
});

