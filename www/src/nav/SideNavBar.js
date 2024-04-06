import './part/ThemeController';

const menuList = [
  { url: 'page.flay-page.html', name: 'flay page' },
  { url: 'page.flay-girls.html', name: 'flay girls' },
  {},
  { url: 'page.archive.html', name: 'flay archive' },
  { url: 'page.flay-one.html', name: 'flay one' },
  { url: 'page.flay-grid.html', name: 'flay grid' },
  { url: 'page.dragndrop.html', name: 'drag & drop' },
  {},
  { url: 'page.tags.html', name: 'tags' },
  { url: 'page.shot-history.html', name: 'shot history' },
  { url: 'page.statistics.html', name: 'statistics' },
  {},
  { url: 'page.control.html', name: 'control' },
  {},
  { url: 'page.image-page.html', name: 'image page' },
  { url: 'page.image-one.html', name: 'image one' },
  { url: 'page.image-fall.html', name: 'image fall' },
  {},
  { url: 'page.kamoru-diary.html', name: 'diary' },
  {},
  { url: 'blank.html', name: 'blank' },
];

export default class SideNavBar extends HTMLElement {
  debug = 0; // elememnts를 구분해서 보기 위한 조건

  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.parentElement.closest('html').querySelector('head').appendChild(document.createElement('style')).innerHTML = PARENT_CSS;
    this.parentElement.insertBefore(document.createElement('label'), this).classList.add('nav-open');

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.tyoe = 'text/css';
    link.href = 'style/component.css';

    const style = this.shadowRoot.appendChild(document.createElement('style'));
    style.innerHTML = CSS;

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = `
    <header>
      <div><a href="index.html">flay ground</a></div>
    </header>
    <article>
      ${menuList
        .map((menu) => {
          if (menu.url) return `<div class="menu"><a href="${menu.url}">${menu.name}</a></div>`;
          return '<div></div>';
        })
        .join('')}
    </article>
    <footer>
      <div><a id="debug">debug</a></div>
      <div><a id="swagger">swagger↗</a></div>
      <div><a id="dependencies">dependencies↗</a></div>
      <div style="margin-top: 1rem;"><theme-controller></theme-controller></div>
    </footer>
    `;

    this.shadowRoot.querySelectorAll('a').forEach((anker) => {
      if (anker.href.indexOf(location.pathname) > -1) {
        anker.parentElement.classList.add('active');
      }
    });

    this.shadowRoot.addEventListener('click', (e) => {
      console.debug('click', e.target.tagName);
      if (e.target.tagName === 'A') {
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
          default:
            break;
        }
      } else {
        this.classList.toggle('open');
      }
    });
  }
}

// Define the new element
customElements.define('side-nav', SideNavBar);

const CSS = `
.side-nav {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: space-between;
}
.side-nav > header {
  padding: 1rem;
}
.side-nav > header a {
  font-size: var(--size-largest);
}
.side-nav > article {
  margin-bottom: auto;
  padding: 1rem;
  overflow: auto;
}
.side-nav > footer {
  padding: 1rem;
}

div {
  line-height: 2rem;
}
div:empty {
  margin-bottom: 1rem;
}
.active > a {
  color: var(--color-checked);
}
a {
  font-family: 'Ink Free';
  text-transform: capitalize;
}
`;

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
  z-index: 74;
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
