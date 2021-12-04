function adjustTheme() {
	var bgThemeValue = LocalStorageItem.get('flay.bgtheme', 'D');

	document.getElementsByTagName('html')[0].setAttribute('data-theme', bgThemeValue);

	// var link = document.querySelector("#themeLink");
	// if (link) {
	// 	document.head.removeChild(link);
	// }
	// if (bgThemeValue === "D") {
	// 	var link = document.createElement("link");
	// 	link.setAttribute("id", "themeLink");
	// 	link.setAttribute("rel", "stylesheet");
	// 	link.setAttribute("href", "/css/theme/flay.theme.dark.css");
	// 	document.head.appendChild(link);
	// }
}

adjustTheme();
