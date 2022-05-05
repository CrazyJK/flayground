import { LocalStorageItem } from '../crazy.common.js';

function adjustTheme() {
  const bgThemeValue = LocalStorageItem.get('flay.bgtheme', 'dark');
  document.getElementsByTagName('html')[0].setAttribute('data-theme', bgThemeValue);
}

adjustTheme();
