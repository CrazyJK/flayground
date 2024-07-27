import '../flay/FlayMonitor';
import './part/ThemeController';
import './SideNavBar.scss';

const menuList = [
  { url: 'page.flay-page.html', name: 'flay page' },
  {},
  { url: 'page.flay-play.html', name: 'flay play' },
  { url: 'page.flay-basket.html', name: 'basket' },
  {},
  { url: 'page.archive.html', name: 'flay archive' },
  { url: 'page.flay-one.html', name: 'flay one' },
  { url: 'page.flay-grid.html', name: 'flay grid' },
  { url: 'page.dragndrop.html', name: 'drag & drop' },
  {},
  { url: 'page.flay-girls.html', name: 'girls' },
  { url: 'page.statistics.html', name: 'statistics' },
  { url: 'page.shot-history.html', name: 'shot history' },
  {},
  { url: 'page.studio.html', name: 'studio' },
  { url: 'page.actress.html', name: 'actress' },
  { url: 'page.tags.html', name: 'tags' },
  {},
  { url: 'page.control.html', name: 'control' },
  {},
  { url: 'page.image-one.html', name: 'image one' },
  { url: 'page.image-page.html', name: 'image page' },
  { url: 'page.image-fall.html', name: 'image fall' },
  {},
  { url: 'page.kamoru-diary.html', name: 'diary' },
  {},
  { url: 'style.html', name: 'style' },
];

export default class SideNavBar extends HTMLElement {
  debug = 0; // elememnts를 구분해서 보기 위한 조건

  static get observedAttributes() {
    return ['class'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug('attributeChangedCallback', name, oldValue, newValue);
    if (name === 'class') {
      oldValue?.split(' ').forEach((cssClass) => cssClass !== '' && this.shadowRoot.querySelector('.' + this.tagName.toLowerCase()).classList.remove(cssClass));
      newValue?.split(' ').forEach((cssClass) => cssClass !== '' && this.shadowRoot.querySelector('.' + this.tagName.toLowerCase()).classList.add(cssClass));
    }
  }

  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.parentElement.closest('html').querySelector('head').appendChild(document.createElement('style')).innerHTML = PARENT_CSS;
    this.parentElement.insertBefore(document.createElement('label'), this).classList.add('nav-open');

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = `
    <header>
      <div><a href="index.html">flay ground</a></div>
    </header>
    <article>
      ${menuList.map((menu) => (menu.url ? `<div class="menu"><a href="${menu.url}">${menu.name}</a><a onclick="window.open('${menu.url}', '${menu.name}', 'width=800,height=1000')">↗</a></div>` : '<div></div>')).join('')}
    </article>
    <footer>
      <div><flay-monitor></flay-monitor></div>
      <div><a id="debug">debug</a></div>
      <div><a id="swagger">swagger↗</a></div>
      <div><a id="dependencies">dependencies↗</a></div>
      <div style="margin-top: 1rem;"><theme-controller></theme-controller></div>
    </footer>
    `;

    /** active 메뉴 표시 */
    this.shadowRoot.querySelectorAll('a').forEach((anker) => {
      if (anker.href.indexOf(location.pathname) > -1) {
        anker.parentElement.classList.add('active');
      }
    });

    this.shadowRoot.addEventListener('click', (e) => {
      const tagName = e.target.tagName;
      console.debug('click', tagName);
      if (tagName === 'A') {
        switch (e.target.id) {
          case 'debug': {
            this.debug = ++this.debug % 3;
            document.documentElement.setAttribute('debug', this.debug);
            break;
          }
          case 'dependencies':
            window.open('dependencies-viewer.html', 'dependencies-viewer', `width=${window.innerWidth}px,height=${window.innerHeight}px'`);
            break;
          case 'swagger':
            window.open('/swagger-ui/index.html', 'swagger', `width=${window.innerWidth}px,height=${window.innerHeight}px'`);
            break;
        }
      } else if (tagName === 'FLAY-MONITOR') {
        window.open('popup.monitor.html', 'popup.monitor', 'width=1200,height=320');
      } else {
        this.classList.toggle('open');
      }
    });
  }
}

// Define the new element
customElements.define('side-nav', SideNavBar);

const PARENT_CSS = `
.nav-open {
  position: fixed;
  top: 0;
  left: 0;
  width: 2rem;
  height: 2rem;
  background-color: transparent;
  z-index: 69;
}
side-nav {
  position: fixed;
  top: 0;
  left: -10rem;
  bottom: 0;
  width: 10rem;
  transition: linear left 0.4s 0.4s, box-shadow 0.8s;
  z-index: 6974;
  background-color: var(--color-bg);
  border-right: 1px solid var(--color-border);
}
.nav-open:hover + side-nav,
side-nav:hover,
side-nav.open {
  left: 0;
  transition: left 0.4s, box-shadow 0.8s;
}
side-nav.open {
  box-shadow: var(--box-shadow-small);
}
`;
