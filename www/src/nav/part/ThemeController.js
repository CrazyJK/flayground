import SVG from '../../svg/svg.json';
import FlayStorage from '../../util/FlayStorage';
import { componentCss } from '../../util/componentCssLoader';

export default class ThemeController extends HTMLElement {
  constructor(listener) {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    const wrapper = document.createElement('div');
    wrapper.classList.add('theme-controller');
    this.shadowRoot.append(STYLE, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    const DIV = wrapper.appendChild(document.createElement('div'));
    DIV.classList.add('theme-group');
    ['os', 'light', 'dark'].forEach((theme) => makeThemeRadio(DIV, theme));
  }
}

// Define the new element
customElements.define('theme-controller', ThemeController);

const asisTheme = FlayStorage.local.get('FlayNav.theme', 'os');

const makeThemeRadio = (parent, theme) => {
  const radio = parent.appendChild(document.createElement('input'));
  radio.type = 'radio';
  radio.name = 'theme';
  radio.id = 'theme' + theme;
  radio.value = theme;
  radio.title = theme;
  radio.addEventListener('click', (e) => {
    if (e.target.value !== 'os') {
      changeTheme(e.target.value === 'dark');
    } else {
      changeTheme(getPrefersColorSchemeDarkQuery().matches, true);
    }
  });

  const label = parent.appendChild(document.createElement('label'));
  label.setAttribute('for', 'theme' + theme);
  label.innerHTML = SVG.theme[theme];

  if (theme === asisTheme) {
    radio.click();
  }
};

const changeTheme = (isDarkMode, isOS) => {
  let mode = isDarkMode ? 'dark' : 'light';
  document.documentElement.setAttribute('theme', mode);
  if (isOS) {
    FlayStorage.local.set('FlayNav.theme', 'os');
  } else {
    FlayStorage.local.set('FlayNav.theme', mode);
  }
};

const getPrefersColorSchemeDarkQuery = () => {
  if (!window.matchMedia) {
    return null;
  }
  return window.matchMedia('(prefers-color-scheme: dark)');
};

const runOsThemeListener = (fn) => {
  const query = getPrefersColorSchemeDarkQuery();
  if (query === null) {
    return;
  }
  fn(query.matches);
  query.addEventListener('change', (event) => fn(event.matches));
};

runOsThemeListener(changeTheme);

const CSS = `
${componentCss}
.theme-controller {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0.125rem 0.5rem;
}
.theme-group {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
}
.theme-group > input + label > svg {
  width: 1.5rem;
  height: 1.5rem;
}
`;
