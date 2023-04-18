import FlayStorage from '../../util/flay.storage';
import SVG from '../svg.json';

/**
 *
 */
export default class FlayNav extends HTMLElement {
  constructor(listener) {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const wrapper = document.createElement('div');
    wrapper.classList.add('nav');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');
    this.shadowRoot.append(link, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    const HEADER_IMG = wrapper.appendChild(document.createElement('img'));
    HEADER_IMG.src = './img/svg/flayground-text.svg';

    const MENU_LIST = wrapper.appendChild(document.createElement('ul'));

    ['page', 'search', 'batch', 'candidate'].forEach((menu, index) => {
      const LI = MENU_LIST.appendChild(document.createElement('li'));
      const ANKER = LI.appendChild(document.createElement('a'));
      ANKER.innerHTML = menu.toLocaleUpperCase();
      ANKER.addEventListener('click', (e) => {
        console.log('anker click', menu);
        MENU_LIST.childNodes.forEach((child) => {
          child.classList.remove('active');
        });
        e.target.parentNode.classList.toggle('active');
        listener(menu);
      });

      if (index === 0) {
        LI.classList.add('active');
      }
    });

    const OPTION_LIST = wrapper.appendChild(document.createElement('ul'));
    // theme
    const LI = OPTION_LIST.appendChild(document.createElement('li'));
    const DIV = LI.appendChild(document.createElement('div'));
    DIV.classList.add('theme-group');
    ['os', 'light', 'dark'].forEach((theme) => makeThemeRadio(DIV, theme));
  }
}

// Define the new element
customElements.define('flay-nav', FlayNav);

const asisTheme = FlayStorage.local.get('FlayNav.theme', 'os');

const makeThemeRadio = (parent, theme) => {
  const radio = parent.appendChild(document.createElement('input'));
  radio.type = 'radio';
  radio.name = 'theme';
  radio.id = 'theme' + theme;
  radio.value = theme;
  radio.addEventListener('click', (e) => {
    if (e.target.value !== 'os') {
      changeTheme(e.target.value === 'dark');
    } else {
      changeTheme(getPrefersColorSchemeDarkQuery().matches);
    }
  });

  const label = parent.appendChild(document.createElement('label'));
  label.setAttribute('for', 'theme' + theme);
  label.innerHTML = SVG.theme[theme];

  if (theme === asisTheme) {
    radio.click();
  }
};

const changeTheme = (isDarkMode) => {
  let mode = isDarkMode ? 'dark' : 'light';
  FlayStorage.local.set('FlayNav.theme', mode);
  document.documentElement.setAttribute('theme', mode);
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
