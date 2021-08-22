/**
 * flay domain object
 */
"use strict";

var tagList;

class Flay {

	static from(json) {
		return Object.assign(new Flay(), json);
	}

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

	constructor(json) {
		return Object.assign(this, json);
	}

	getTagList() {
		if ($.isEmptyObject(tagList)) {
			$.ajax({
				url: "/info/tag/list",
				async: false,
				success: (list) => {
					console.log("/info/tag/list", list);
					list.sort(function(t1, t2) {
						return t1.name.localeCompare(t2.name);
					});
					tagList = list;
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
		console.log(this);
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
					$("<div>").append(this.title)
				),
				$("<dd>", {class: "flay-tags"}).append(
					$("<div>").append(
						(() => {
							let ret = [];
							this.video.tags.forEach((t) => {
								ret.push($("<span>").html(this.getTag(t).name));
							});
							ret.push(
								$("<span>", {class: "extra"}).append(
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
							const $actress = $("<div>", {id: name.replace(/ /g, "")}).append(
								$("<span>").html(name)
							);
							ret.push($actress);
							$.ajax({
								url: "/info/actress/" + name,
								success: (a) => {
									console.log("actress", a);
									$("#" + a.name.replace(/ /g, "")).append(
										$("<span>", {class: "actress-favorite" + (a.favorite ? " active" : "")}).append(
											$("<i>", {class: "fa fa-star"})
										),
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
						console.log("rank change", e.target.value, e.data.opus);
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
						$("<span>", {class: "extra"}).html(this.video.play + " <small>play</small>").on("click", this, function (e) {
							console.log("play click", e.data.opus);
						}),
						$("<span>", {class: "extra"}).append(
							$("<i>", {class: "fa fa-folder-open"}).on("click", function () {
								$(".flay-files").toggle();
							})
						),
					),
				),
				$("<dd>", {class: "flay-comment"}).append(
					$("<div>").append(
						$("<span>", {class: "extra"}).append(
							$("<i>", {class: "fa fa-comment"})
						),
						$("<span>").append(
							this.video.comment
						),
					),
				),
				$("<dd>", {class: "flay-modified"}).append(
					$("<div>").append(
						$("<span>").append(Flay.date(this.lastModified)),
						$("<small>", {class: "extra"}).append(Flay.time(this.lastModified)),
					),
				),
				$("<dd>", {class: "flay-access"}).append(
					$("<div>").append(
						(() => {
							let ret = [];
							if (this.video.lastAccess === 0) {
								ret.push($("<small>", {class: "extra"}).append("never accessed"));
							} else {
								ret.push($("<span>").append(Flay.date(this.video.lastAccess)));
								ret.push($("<small>", {class: "extra"}).append(Flay.time(this.video.lastAccess)));
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
				}),
			),
		);
	}
}

