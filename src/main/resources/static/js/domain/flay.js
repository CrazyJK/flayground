/**
 * flay domain object
 */

"use strict";

var tagList;

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

	constructor(json) {
		return Object.assign(this, json);
	}

	getTagList() {
		if ($.isEmptyObject(tagList)) {
			Flay.ajax({
				url: "/info/tag/list",
				async: false,
				success: (list) => {
					list.sort(function(t1, t2) {
						return t1.name.localeCompare(t2.name);
					});
					tagList = list;
					console.info(`Tag ${tagList.length} loaded`);
				}
			});
		}
		return tagList;
	}

	getTag(id) {
		for (let tag of this.getTagList()) {
			if (tag.id === id) {
				return tag;
			}
		}
		return null;
	}

	$() {
		console.info(`Flay jquery element created`, this);
		return $("<section>", {class: "flay " + (this.archive ? "flay-archive" : "flay-instance")}).append(
			$("<div>", {class: "flay-cover"}).css({
				background: "#222 url(/static/cover/"  + this.opus + ") no-repeat center / contain"
			}),
			// $("<img>", {class: "flay-cover", src: "/static/cover/" + this.opus}),
			$("<dl>", {class: "flay-body"}).append(
				$("<dt>", {class: "flay-fullname"}).append(
					$("<div>").append(this.fullname)
				),
				$("<dt>", {class: "flay-title"}).append(
					$("<div>").append(this.title).on("click", this, (e) => {
						Flay.popup("/html/info/info.flay.html?opus=" + e.data.opus, e.data.opus, 800, 530);
					})
				),
				$("<dd>", {class: "flay-tags"}).append(
					$("<div>").append(
						(() => {
							let ret = [];
							this.video.tags.forEach((t) => {
								ret.push($("<span>").html(this.getTag(t).name));
							});
							ret.push(
								$("<span>", {class: "extra tag-show"}).append(
									$("<i>", {class: "fa fa-tags"}).on("click", function () {
										$(".flay-taglist").toggle();
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
							ret.push(
								$("<div>", {id: name.replace(/ /g, "")}).append(
									$("<span>", {class: "actress-name"}).html(name).on("click", function () {
										Flay.popup("/html/info/info.actress.html?name=" + name, name, 1076, 800);
									})
								)
							);
							Flay.ajax({
								url: "/info/actress/" + name,
								success: (a) => {
									console.debug("actress loaded", a);
									$("#" + a.name.replace(/ /g, "")).append(
										$("<span>", {class: "actress-favorite" + (a.favorite ? " active" : "")}).append(
											$("<i>", {class: "fa fa-star"})
										).on("click", function () {
											const $actressFavorite = $(this);
											a.favorite = !a.favorite
											Flay.ajax({
												url: "/info/actress",
												methid: "PATCH",
												data: a,
												success: () => {
													$actressFavorite.toggleClass("active", a.favorite);
												}
											});
										}),
										$("<small>", {class: "extra"}).append(a.localName),
										$("<small>", {class: "extra"}).append(a.birth),
										$("<small>", {class: "extra"}).append(Flay.getActressAge(a)),
										$("<small>", {class: "extra"}).append(a.debut > 0 ? a.debut : ""),
										$("<small>", {class: "extra"}).append(a.body),
										$("<small>", {class: "extra"}).append(a.height > 0 ? a.height : ""),
									);
								}
							});
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
										$("<i>", {class: "fa fa-" + (r === -1 ? "thumbs-down" : r === 0 ? "circle" : "star") + " r" + r})
									)
								);
							});
							return ret;
						})()
					).on("change", "input", this, function (e) {
						console.debug("rank change", e.target.value, e.data.opus);
					}),
				),
				$("<dd>", {class: "flay-info"}).append(
					$("<div>").append(
						$("<span>").html(
							Flay.fileLength(this.length)
						),
						$("<span>", {class: "extra"}).html(
							this.files.movie.length + " <small>V</small>"
						),
						$("<span>").html(
							this.files.subtitles.length + " <small>sub</small>"
						),
						$("<span>", {class: "extra flay-play"}).html(this.video.play + " <small>play</small>").on("click", this, function (e) {
							console.info("play click", e.data.opus);
							Flay.ajax({
								url: "/flay/play/" + e.data.opus,
								method: "PATCH"
							})
						}),
						$("<span>", {class: "extra files-show"}).append(
							$("<i>", {class: "fa fa-folder-open"}).on("click", function () {
								$(".flay-files").toggle();
							})
						),
					),
				),
				$("<dd>", {class: "flay-comment"}).append(
					$("<div>").append(
						$("<input>", {class: "extra comment-edit"}).on("keyup", this, function (e) {
							if (e.keyCode === 13) {
								e.data.video.comment = e.target.value;
								Flay.ajax({
									url: "/info/video",
									method: "PATCH",
									contentType: "application/json",
									data: JSON.stringify(e.data.video),
									success: () => {

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
							this.getTagList().forEach((t) => {
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
				$("<span>", {class: "flay-body-toggle"}).append(
					$("<i>", {class: "fa fa-arrow-circle-down"})
				).on("click", () => {
					$(".flay-body").toggleClass("flay-body-separate");
					$(".flay-body-toggle i").toggleClass("fa fa-arrow-circle-down").toggleClass("fa fa-arrow-circle-up");
				}),
			),
		);
	}
}

