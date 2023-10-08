import FlayStorage from '../util/FlayStorage';

const THEME_KEY = 'FlayNav.theme';
const OS = 'os';
const LIGHT = 'light';
const DARK = 'dark';

const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

let theme = FlayStorage.local.get(THEME_KEY);
let isDark;

/**
 * Storage theme change Listener
 */
onstorage = (e) => {
  console.debug('onstorage', e.key, e.oldValue, e.newValue);
  if (e.key === THEME_KEY) {
    theme = e.newValue;
    applyTheme();
  }
};

darkMediaQuery.addEventListener('change', () => {
  if (theme === OS) {
    applyTheme();
  }
});

const applyTheme = () => {
  if (theme === OS) {
    isDark = darkMediaQuery.matches;
  } else {
    isDark = theme === DARK;
  }

  document.documentElement.setAttribute('theme', isDark ? DARK : LIGHT);
};

applyTheme();
