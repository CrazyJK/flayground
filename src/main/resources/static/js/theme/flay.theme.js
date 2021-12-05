function adjustTheme() {
	var bgThemeValue = LocalStorageItem.get('flay.bgtheme', 'dark');

	document.getElementsByTagName('html')[0].setAttribute('data-theme', bgThemeValue);
}

adjustTheme();
