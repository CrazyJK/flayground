/**
 * Storage theme change Listener
 */
onstorage = (e) => {
  console.log('onstorage', e.key, e.oldValue, e.newValue);
  if (e.key === 'FlayNav.theme') {
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
    document.getElementsByTagName('html')[0].setAttribute('theme', theme);
  }
};

const getPrefersColorSchemeDarkQuery = () => {
  if (!window.matchMedia) {
    return null;
  }
  return window.matchMedia('(prefers-color-scheme: dark)');
};
