import FlayStorage from './flay.storage';

/**
 * Storage theme change Listener
 */
onstorage = (e) => {
  console.log('onstorage', e.key, e.oldValue, e.newValue);
  if (e.key === THEME_KEY) {
    let theme = '';
    if (e.newValue !== 'os') {
      theme = e.newValue;
    } else {
      const query = getPrefersColorSchemeDarkQuery();
      if (query === null) {
        theme = 'light';
      } else {
        theme = query.matches ? 'dark' : 'light';
      }
    }
    changeTheme(theme);
  }
};

const getPrefersColorSchemeDarkQuery = () => {
  if (!window.matchMedia) {
    return null;
  }
  return window.matchMedia('(prefers-color-scheme: dark)');
};

const changeTheme = (theme) => document.getElementsByTagName('html')[0].setAttribute('theme', theme);

const THEME_KEY = 'FlayNav.theme';

changeTheme(FlayStorage.local.get(THEME_KEY));
