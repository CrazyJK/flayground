import ThemeContrller from '../control/ThemeController';

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

    const HEADER = wrapper.appendChild(document.createElement('header'));
    const home = HEADER.appendChild(document.createElement('a'));
    home.innerHTML = 'flayground';
    home.addEventListener('click', () => {
      location.href = 'index.html';
    });

    const MENU_LIST = wrapper.appendChild(document.createElement('ul'));

    ['page', 'search', 'batch', 'candidate', 'tag'].forEach((menu, index) => {
      const LI = MENU_LIST.appendChild(document.createElement('li'));
      const ANKER = LI.appendChild(document.createElement('a'));
      ANKER.innerHTML = menu;
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
    const LI1 = OPTION_LIST.appendChild(document.createElement('li'));
    const ANKER1 = LI1.appendChild(document.createElement('a'));
    ANKER1.href = './page.control.html';
    ANKER1.innerHTML = 'Control';
    // theme
    const LI2 = OPTION_LIST.appendChild(document.createElement('li'));
    LI2.appendChild(new ThemeContrller());
  }
}

// Define the new element
customElements.define('flay-nav', FlayNav);

const CSS = `
/* for FlayNav */
div.nav {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
}
div.nav > header > a {
  padding: 0.5rem 1rem 1rem;
  font-family: 'Ink Free';
  font-size: var(--font-largest);
  text-transform: capitalize;
}
div.nav > ul:nth-child(2) {
  margin-bottom: auto;
}
div.nav > ul > li {
  padding: 0.25rem 1rem;
  text-align: left;
}
div.nav > ul > li > a {
  font-family: 'Ink Free';
  text-transform: capitalize;
}
div.nav > ul > li.active > a {
  color: var(--color-checked);
}
`;
