import SVG from '../../svg/svg.json';
import FlayStorage from '../../util/FlayStorage';
import { componentCss } from '../../util/componentCssLoader';

const THEME_KEY = 'FlayNav.theme';
const OS = 'os';
const LIGHT = 'light';
const DARK = 'dark';

export default class ThemeController extends HTMLElement {
  theme;
  isDark;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const style = document.createElement('style');
    style.innerHTML = CSS;
    const wrapper = document.createElement('div');
    wrapper.classList.add('theme-controller');
    this.shadowRoot.append(style, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    const themeGroup = wrapper.appendChild(document.createElement('div'));
    themeGroup.classList.add('theme-group');
    [OS, LIGHT, DARK].forEach((theme) => {
      const radio = themeGroup.appendChild(document.createElement('input'));
      radio.type = 'radio';
      radio.id = 'theme' + theme;
      radio.name = 'theme';
      radio.value = theme;
      radio.title = theme;

      const label = themeGroup.appendChild(document.createElement('label'));
      label.setAttribute('for', 'theme' + theme);
      label.innerHTML = SVG.theme[theme];
      label.addEventListener('click', () => {
        FlayStorage.local.set(THEME_KEY, theme);
        console.debug('set Storage Theme', theme);

        this.theme = theme;
        this.applyTheme();
      });
    });
  }

  connectedCallback() {
    this.theme = FlayStorage.local.get(THEME_KEY, OS);
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

    this.onThemeListener();
    this.applyTheme();
  }

  onThemeListener() {
    // storage 변경에 대한 리스너 등록
    onstorage = (e) => {
      console.debug('[onThemeListener] onstorage', e.key, e.oldValue, e.newValue);
      if (e.key === THEME_KEY) {
        this.theme = e.newValue;
        this.applyTheme();
      }
    };
    // os 테마 변경에 대한 리스너 등록
    this.mediaQueryList.addEventListener('change', () => {
      console.debug('[onThemeListener] mediaQuery', this.mediaQueryList);
      if (this.theme === OS) {
        this.applyTheme();
      }
    });
  }

  applyTheme() {
    if (this.theme === OS) {
      this.isDark = this.mediaQueryList.matches;
    } else {
      this.isDark = this.theme === DARK;
    }
    console.debug('[applyTheme] theme', this.theme, 'isDark', this.isDark);

    this.shadowRoot.querySelector('input#theme' + this.theme).checked = true;
    document.documentElement.setAttribute('theme', this.isDark ? DARK : LIGHT);
  }
}

// Define the new element
customElements.define('theme-controller', ThemeController);

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