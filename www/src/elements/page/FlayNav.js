import FlayStorage from '../../util/flay.storage';
import SVG from '../svg.json';

/**
 *
 */
export default class FlayNav extends HTMLElement {
  constructor(listener) {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    const wrapper = document.createElement('div');
    wrapper.classList.add('nav');
    this.shadowRoot.append(LINK, STYLE, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    const HEADER_IMG = wrapper.appendChild(document.createElement('img'));
    HEADER_IMG.src = './img/svg/flayground-text.svg';

    const MENU_LIST = wrapper.appendChild(document.createElement('ul'));

    ['page', 'search', 'batch', 'candidate', 'tag'].forEach((menu, index) => {
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
/* for FlayNav */
div.nav {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
}
div.nav > img {
  margin: 0.25rem 0.5rem;
}
div.nav > ul {
  list-style: none;
  padding: 0;
  margin-bottom: 0.5rem;
}
div.nav > ul > li {
  padding: 0 1rem 0.5rem;
  text-align: left;
}
div.nav > ul > li.active {
  color: var(--color-checked);
}
div.nav > ul:nth-child(2) {
  margin-bottom: auto;
}
div.nav > ul > li > .theme-group {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
div.nav > ul > li > .theme-group label svg {
  width: 2rem;
  height: 2rem;
}
`;
