/**
 * flay domain object
 */

"use strict";

class Flay {

	static DATE_FORMAT_OPTIONS = {
		year: "numeric",	// numeric, 2-digit
		month: "2-digit", 	// numeric, 2-digit, narrow, short, long
		day: "2-digit",		// numeric, 2-digit
	};

	static TIME_FORMAT_OPTIONS = {
		weekday: "short", 	// long, narrow, short
		hour12: false,
		hour: "2-digit",	// numeric, 2-digit
		minute: "2-digit",	// numeric, 2-digit
		second: "2-digit",	// numeric, 2-digit
	};

	static date(time) {
		return new Date(time).toLocaleDateString('ko-KR', Flay.DATE_FORMAT_OPTIONS);
	}

	static time(time) {
		return new Date(time).toLocaleTimeString('ko-KR', Flay.TIME_FORMAT_OPTIONS);
	}

	static KB = 1024;
	static MB = 1024 * Flay.KB;
	static GB = 1024 * Flay.MB;

	static fileLength(bytes) {
		return bytes < Flay.MB ? (bytes / Flay.KB).toFixed(0) + " <small>KB</small>" :
				bytes < Flay.GB ? (bytes / Flay.MB).toFixed(0) + " <small>MB</small>" :
				(bytes / Flay.GB).toFixed(1) + " <small>GB</small>";
	}

	static RANKs = [-1, 0, 1, 2, 3, 4, 5];

	static todayYear = new Date().getFullYear();

	static getActressAge(actress) {
		if (actress.birth && actress.birth.length > 3) {
			return Flay.todayYear - parseInt(actress.birth.substring(0, 4)) + 1;
		} else {
			return '';
		}
	}

	static popup(url, name, width, height) {
		const windowFeatures = "menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,centerscreen=yes,innerWidth=" + width + ",innerHeight=" + height;
		const windowName = name.replace(/ /g, "");
		const windowObjectReference = window.open(url, windowName, windowFeatures);
		console.debug(url, windowName, windowFeatures, windowObjectReference);
	}

	static AJAX_SETTINGS = {
		beforeSend: (jqXHR, settings) => {
			if (settings.method !== "GET") {
				for (const cookie of document.cookie.split(';')) {
					if ("XSRF-TOKEN" === cookie.substr(0, cookie.indexOf('=')).replace(/^\s+|\s+$/g, '')) {
						jqXHR.setRequestHeader("X-XSRF-TOKEN", unescape(cookie.substr(cookie.indexOf('=') + 1)));
						break;
					}
				}
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.error(jqXHR, textStatus, errorThrown, jqXHR.status, jqXHR.responseJSON);
			alert("ajax:"
				+ "\nerror " + jqXHR.responseJSON.error
				+ "\nmessage " + jqXHR.responseJSON.message
				+ "\nstatus " + jqXHR.responseJSON.status
				+ "\npath " + jqXHR.responseJSON.path);
		},
	};

	static ajax(args) {
		const settings = $.extend({}, Flay.AJAX_SETTINGS, args);
		$.ajax(settings);
	}

	static tagList = (function () {
		let _list = [];
		Flay.ajax({
			url: "/info/tag/list",
			async: false,
			success: (list) => {
				list.sort(function(t1, t2) {
					return t1.name.localeCompare(t2.name);
				});
				_list = list;
				console.info(`Tag ${list.length} loaded`);
			}
		});
		return _list;
	}());

	static getTag(id) {
		for (const tag of Flay.tagList) {
			if (tag.id === id) {
				return tag;
			}
		}
		return null;
	}

	static actressList = (function () {
		let _list = [];
		Flay.ajax({
			url: "/info/actress/list",
			async: false,
			success: (list) => {
				_list = list;
				console.info(`Actress ${list.length} loaded`);
			}
		});
		return _list;
	}());

	static getActress(name) {
		for (const actress of Flay.actressList) {
			if (actress.name === name) {
				return actress;
			}
		}
		return null;
	}

	static separateMode = false;

	constructor(json) {
		return Object.assign(this, json);
	}

	update(json) {
		return Object.assign(this, json);
	}

	remove() {
		Flaying.isPlay = false;
	}

	$() {
		console.info(`Flay jquery element created`, this);
		return $("<section>", {class: "flay " + (this.archive ? "flay-archive" : "flay-instance")}).append(
			$("<div>", {class: "flay-cover"}).css({
				background: "#222 url(/static/cover/"  + this.opus + ") no-repeat center / contain"
			}),
			// $("<img>", {class: "flay-cover", src: "/static/cover/" + this.opus}),
			$("<dl>", {class: "flay-body " + (Flay.separateMode ? "flay-body-separate" : "")}).append(
				// $("<dt>", {class: "flay-fullname"}).append(
				// 	$("<div>").append(this.fullname)
				// ),
				$("<dt>", {class: "flay-title"}).append(
					$("<div>", {class: "hover"}).append(this.title).on("click", this, (e) => {
						Flay.popup("/html/info/info.flay.html?opus=" + e.data.opus, e.data.opus, 800, 530);
					})
				),
				$("<dd>", {class: "flay-tags"}).append(
					$("<div>").append(
						(() => {
							let ret = [];
							this.video.tags.forEach((t) => {
								ret.push($("<span>").html(Flay.getTag(t).name));
							});
							ret.push(
								$("<span>", {class: "extra tag-show hover"}).append(
									$("<i>", {class: "fa fa-tags"}).on("click", this, function (e) {
										$(e.target).closest(".flay").find(".flay-taglist").toggle();
									})
								)
							);
							return ret;
						})(),
					),
				),
				$("<dd>", {class: "flay-studio"}).append(
					$("<div>").append(this.studio)
				),
				$("<dd>", {class: "flay-opus"}).append(
					$("<div>").append(this.opus)
				),
				$("<dd>", {class: "flay-actresslist"}).append(
					(() => {
						let ret = [];
						this.actressList.forEach((name) => {
							const actress = Flay.getActress(name);
							ret.push(
								$("<div>", {id: actress.name.replace(/ /g, "")}).append(
									$("<span>", {class: "actress-name hover"}).html(actress.name).on("click", actress, function (e) {
										Flay.popup("/html/info/info.actress.html?name=" + e.data.name, e.data.name, 1076, 800);
									}),
									$("<span>", {class: "actress-favorite hover" + (actress.favorite ? " active" : "")}).append(
										$("<i>", {class: "fa fa-star"})
									).on("click", actress, function (e) {
										const $actressFavorite = $(this);
										e.data.favorite = !e.data.favorite
										Flay.ajax({
											url: "/info/actress",
											method: "PATCH",
											contentType: "application/json",
											data: JSON.stringify(e.data),
											success: () => {
												$actressFavorite.toggleClass("active", e.data.favorite);
												console.info(`${e.data.name} favorite ${e.data.favorite}`);
											}
										});
									}),
									$("<small>", {class: "extra"}).append(actress.localName),
									$("<small>", {class: "extra"}).append(actress.birth),
									$("<small>", {class: "extra"}).append(Flay.getActressAge(actress)),
									$("<small>", {class: "extra"}).append(actress.debut > 0 ? actress.debut : ""),
									$("<small>", {class: "extra"}).append(actress.body),
									$("<small>", {class: "extra"}).append(actress.height > 0 ? actress.height : ""),
								)
							);
						});
						return ret;
					})(),
				),
				$("<dd>", {class: "flay-release"}).append(
					$("<div>").append(this.release)
				),
				$("<dd>", {class: "flay-rank"}).append(
					$("<div>").append(
						(() => {
							let ret = [];
							Flay.RANKs.forEach((r) => {
								ret.push(
									$("<label>").append(
										$("<input>", {type: "radio", name: "rank", value: r, checked: (r === this.video.rank)}),
										$("<i>", {class: "hover fa fa-" + (r === -1 ? "thumbs-down" : r === 0 ? "circle" : "star") + " r" + r})
									)
								);
							});
							return ret;
						})()
					).on("change", "input", this, function (e) {
						e.data.video.rank = e.target.value;
						Flay.ajax({
							url: "/info/video",
							method: "PATCH",
							contentType: "application/json",
							data: JSON.stringify(e.data.video),
							success: () => {
								console.debug("rank changed", e.target.value, e.data.opus);
							}
						});
					}),
				),
				$("<dd>", {class: "flay-info"}).append(
					$("<div>").append(
						$("<span>").html(Flay.fileLength(this.length)),
						$("<span>", {class: "extra"}).html(this.files.movie.length + " <small>V</small>"),
						$("<span>").html(this.files.subtitles.length + " <small>sub</small>"),
						$("<span>", {class: "extra flay-play hover"}).html(this.video.play + " <small>play</small>").on("click", this, function (e) {
							Flay.ajax({
								url: "/flay/play/" + e.data.opus,
								method: "PATCH",
								success: () => {
									console.info(`${e.data.opus} played`);
								}
							})
						}),
						$("<span>", {class: "extra flay-view hover"}).html(this.files.movie.length > 0 ? "<small>View</small>" : "").on("click", this, Flaying.start),
						$("<span>", {class: "extra files-show hover"}).append(
							$("<i>", {class: "fa fa-folder-open"}).on("click", this, function (e) {
								$(e.target).closest(".flay").find(".flay-files").toggle();
							})
						),
					),
				),
				$("<dd>", {class: "flay-comment"}).append(
					$("<div>").append(
						$("<input>", {class: "extra comment-edit hover"}).on("keyup", this, function (e) {
							e.stopPropagation();
							if (e.keyCode === 13) {
								e.data.video.comment = e.target.value;
								Flay.ajax({
									url: "/info/video",
									method: "PATCH",
									contentType: "application/json",
									data: JSON.stringify(e.data.video),
									success: () => {
										console.info(`${e.data.video.opus} comment ${e.data.video.comment}`);
									}
								});
							}
						}).val(this.video.comment),
					),
				),
				$("<dd>", {class: "flay-modified"}).append(
					$("<div>").append(
						$("<span>", {title: "last modified"}).append(Flay.date(this.lastModified)),
						$("<small>", {class: "extra", title: "last modified"}).append(Flay.time(this.lastModified)),
					),
				),
				$("<dd>", {class: "flay-access"}).append(
					$("<div>").append(
						(() => {
							let ret = [];
							if (this.video.lastAccess === 0) {
								ret.push($("<small>", {class: "extra", title: "last access"}).append("never accessed"));
							} else {
								ret.push($("<span>").append(Flay.date(this.video.lastAccess)));
								ret.push($("<small>", {class: "extra", title: "last access"}).append(Flay.time(this.video.lastAccess)));
							}
							return ret;
						})()
					),
				),
			),
			$("<dl>", {class: "flay-ext"}).append(
				$("<dd>", {class: "flay-taglist"}).append(
					$("<div>").append(
						(() => {
							let ret = [];
							Flay.tagList.forEach((t) => {
								ret.push(
									$("<span>", {class: "tag-item" + (this.video.tags.indexOf(t.id) > -1 ? " active" : ""), title: t.description, id: "tag" + t.id}).html(t.name)
								);
							});
							return ret;
						})()
					),
				),
				$("<dd>", {class: "flay-files"}).append(
					(() => {
						let ret = [];
						this.files.cover.forEach((f) => {
							ret.push(
								$("<div>", {class: "flay-file-cover"}).html(f)
							);
						});
						this.files.movie.forEach((f) => {
							ret.push(
								$("<div>", {class: "flay-file-movie"}).html(f)
							);
						});
						this.files.subtitles.forEach((f) => {
							ret.push(
								$("<div>", {class: "flay-file-sub"}).html(f)
							);
						});
						this.files.candidate.forEach((f) => {
							ret.push(
								$("<div>", {class: "flay-file-candi"}).html(f)
							);
						});
						return ret;
					})(),
				),
			),
			$("<div>", {class: "right-bottom"}).append(
				$("<span>", {class: "flay-body-toggle hover"}).append(
					$("<i>", {class: "fa " + (Flay.separateMode ? "fa-arrow-circle-up" : "fa-arrow-circle-down")})
				).on("click", () => {
					$(".flay-body").toggleClass("flay-body-separate");
					$(".flay-body-toggle i").toggleClass("fa fa-arrow-circle-down").toggleClass("fa fa-arrow-circle-up");
					Flay.separateMode = $(".flay-body").hasClass("flay-body-separate");
				}),
			),
			$("<div>", {class: "flay-video"}).append(
				$("<video>"),
				$("<div>").append(
					$("<i>", {class: "hover fa fa-window-restore"}).on("click", this, Flaying.window.restore),
					$("<i>", {class: "hover fa fa-window-maximize"}).on("click", this, Flaying.window.maximize),
					$("<i>", {class: "hover fa fa-window-close"}).on("click", this, Flaying.stop),
				),
			),
		);
	}
}

var Flaying = {
	isPlay: false,
	seekTime: 10,
	start: function (e) {
		e.stopPropagation();
		if (!Flaying.isPlay) {
			const $flayVideo = $(this).closest(".flay").find(".flay-video").show();
			const $video = $flayVideo.find("video");
			if (typeof $video.attr("src") === 'undefined') {
				$video.attr({
					controls: "true",
					poster: "/static/cover/" + e.data.opus,
					src: "/stream/flay/movie/" + e.data.opus + "/0",
				});
			}
			$video
				.off("wheel")
				.on("wheel", e.data, function (e) {
					e.stopPropagation();
					if (e.originalEvent.wheelDelta < 0) {
						Flaying.forward(e);
					} else {
						Flaying.backward(e);
					}
				});
			$video.get(0).play();
			Flaying.isPlay = true;
		}
	},
	stop: function (e) {
		e.stopPropagation();
		$(this).closest(".flay").find(".flay-video").hide().find("video").off("wheel").get(0).pause();
		Flaying.isPlay = false;
	},
	forward: function (e) {
		e.stopPropagation();
		if (Flaying.isPlay) {
			// if built-in video seek, do nothing
			if (e.type !== "wheel" && e.target.tagName === "VIDEO") {
				return;
			}
			$(e.target).closest(".flay").find("video").get(0).currentTime += Flaying.seekTime;
		}
	},
	backward: function (e) {
		e.stopPropagation();
		if (Flaying.isPlay) {
			// if built-in video seek, do nothing
			if (e.type !== "wheel" && e.target.tagName === "VIDEO") {
				return;
			}
			$(e.target).closest(".flay").find("video").get(0).currentTime -= Flaying.seekTime;
		}
	},
	window : {
		restore: function (e) {
			e.stopPropagation();
			$(this).closest(".flay").find(".flay-video").removeClass("window-maximize");
			$(this).hide().next().show();
		},
		maximize: function (e) {
			e.stopPropagation();
			$(this).closest(".flay").find(".flay-video").addClass("window-maximize");
			$(this).hide().prev().show();
		}
	}
};
