import FlayStorage from './flay.storage';

/**
 * Storage theme change Listener
 */
onstorage = (e) => {
  console.log('onstorage', e.key, e.oldValue, e.newValue);
  if (e.key === THEME_KEY) {
    changeTheme(e.newValue);
  }
};

const getPrefersColorSchemeDarkQuery = () => {
  if (!window.matchMedia) {
    return null;
  }
  return window.matchMedia('(prefers-color-scheme: dark)');
};

const changeTheme = (theme) => {
  if (theme === 'os') {
    const query = getPrefersColorSchemeDarkQuery();
    if (query === null) {
      theme = 'light';
    } else {
      theme = query.matches ? 'dark' : 'light';
    }
  }
  document.getElementsByTagName('html')[0].setAttribute('theme', theme);
};

const THEME_KEY = 'FlayNav.theme';

changeTheme(FlayStorage.local.get(THEME_KEY));
