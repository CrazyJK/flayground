var todayisList;

Rest.Todayis.list((list) => {
	todayisList = list;

	$("#sorting > label:nth-child(3)").click();

	$(".folder-info").each((idx, dom) => {
		console.log($(dom).text());
		if ($(dom).text().indexOf("Enter") > -1) {
			$(dom).closest(".folder").find(".toggle-folder i").click();
		}
	});
});

$("input[name='sort']").on("change", () => {
	var compareTo = function (d1, d2) {
		if (typeof d1 === "number") {
			return d1 - d2;
		} else if (typeof d1 === "string") {
			return d1.toLowerCase().localeCompare(d2.toLowerCase());
		} else {
			return d1 > d2 ? 1 : -1;
		}
	};

	// sorting
	const sort = $("input[name='sort']:checked").val();
	todayisList.sort(function (t1, t2) {
		var c1 = compareTo(t2.path, t1.path);
		switch (sort) {
			case "T":
				return c1 === 0 ? compareTo(t1.name, t2.name) : c1;
			case "L":
				return c1 === 0 ? compareTo(t1.length, t2.length) : c1;
			case "M":
				return c1 === 0 ? compareTo(t1.lastModified, t2.lastModified) : c1;
		}
	});

	const $folderWrapper = $("#folderWrapper").empty();
	let previousPath = "";
	let size = 0;
	let length = 0;
	let currendFolderIndex = -1;

	$.each(todayisList, (idx, todayis) => {
		if (todayis.path !== previousPath) {
			$("<div>", { class: "folder", id: "fidx" + ++currendFolderIndex })
				.append(
					$("<div>", { class: "folder-info" }).append(
						$("<span>")
							.on("click", todayis, (e) => {
								Rest.Todayis.openFolder(e.data.path);
							})
							.html(todayis.path),
						$("<span>", { class: "ml-3 toggle-folder" })
							.on("click", (e) => {
								console.log("folder toggle", e.target);
								$(e.target).closest(".folder").find(".folder-items").toggle();
								$(e.target).toggleClass("fa-toggle-down fa-toggle-up");
							})
							.append($("<i>", { class: "fa fa-toggle-down" })),
					),
					$("<div>", { class: "folder-items" }),
				)
				.appendTo($folderWrapper);
		}
		previousPath = todayis.path;
		size++;
		length += todayis.length;

		$("<div>", { class: "item", "data-idx": idx })
			.append(
				$("<div>", { class: "item-title" }).append(
					$("<span>", { class: "text-title" })
						.on("click", todayis, function (e) {
							Rest.Todayis.play(e.data, () => {
								$(e.target).closest(".item").addClass("played");
							});
						})
						.html(todayis.name.slice(0, -4).replace(/\-|[.]/gi, " ")),
				),
				$("<div>", { class: "item-info" }).append($("<span>", { class: "text-modified" }).html(new Date(todayis.lastModified).format("yyyy-MM-dd")), $("<span>", { class: "text-length" }).html(File.formatSize(todayis.length))),
				$("<div>", { class: "item-action" }).append(
					$("<span>", { class: "text-play" })
						.on("click", todayis, (e) => {
							console.log("play click", e.data.uuid);
							const newUrl = "/todayis/stream/" + e.data.uuid;
							const curUrl = $("#videoWrapper video").attr("src");
							if (newUrl !== curUrl) {
								$("#videoWrapper video").attr({ src: newUrl });
							}
							$("#videoWrapper").show();
							$("#videoWrapper video").get(0).play();
							$(e.target).closest(".item").addClass("played");
						})
						.html("Play"),
					$("<span>", { class: " text-suffix" }).html(todayis.name.slice(todayis.name.length - 3, todayis.name.length)),
					$("<span>", { class: "text-delete" })
						.on("click", todayis, function (e) {
							if (confirm("is delete this movie?\n" + e.data.name)) {
								Rest.Todayis.delete(e.data, () => {
									const idx = $(e.target).closest(".item").addClass("deleted").attr("data-idx");
									todayisList.splice(parseInt(idx), 1);
								});
							}
						})
						.html("Delete"),
				),
			)
			.appendTo($("#fidx" + currendFolderIndex + " > div:nth-child(2)"));
	});

	$("#size").html(size + " Movie");
	$("#length").html(File.formatSize(length));
});

$("#videoWrapper").on("wheel", (e) => {
	console.log("wheel", e);
	e.stopPropagation();
	const video = $("#videoWrapper video").get(0);
	const videoSeekTime = 10;
	if (e.originalEvent.wheelDelta < 0) {
		video.currentTime += videoSeekTime;
	} else {
		video.currentTime -= videoSeekTime;
	}
});

$("#videoWrapper span.stop").on("click", (e) => {
	console.log("stop click", e.target);
	$("#videoWrapper video").get(0).pause();
	$("#videoWrapper").hide();
});

$(window)
	.on("resize", () => {
		$("#folderWrapper").height(window.innerHeight - $("#topMenu").height());
	})
	.trigger("resize");
