import '../control/ThemeController';

export default class SideNavBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    const WRAPPER = document.createElement('div');
    WRAPPER.classList.add('nav');
    WRAPPER.innerHTML = HTML;
    this.shadowRoot.append(LINK, STYLE, WRAPPER); // 생성된 요소들을 shadow DOM에 부착합니다

    this.render();
  }

  render() {}

  connectedCallback() {
    console.debug('connected', this.parentElement, this.parentElement.closest('html').querySelector('head'), this.shadowRoot.querySelectorAll('a'));

    this.renderParent();

    this.markActiveMenu();
  }

  renderParent() {
    const NAV_OPEN = document.createElement('label');
    NAV_OPEN.classList.add('nav-open');
    this.parentElement.insertBefore(NAV_OPEN, this);

    const PAREMT_STYLE = document.createElement('style');
    PAREMT_STYLE.innerHTML = PARENT_CSS;
    this.parentElement.closest('html').querySelector('head').append(PAREMT_STYLE);
  }

  markActiveMenu() {
    this.shadowRoot.querySelectorAll('a').forEach((anker) => {
      if (anker.href.indexOf(location.pathname) > -1) {
        anker.parentElement.classList.add('active');
      }
    });
  }
}

// Define the new element
customElements.define('side-nav', SideNavBar);

const CSS = `
div.nav {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
}

div.nav > header.active > a {
  color: var(--color-checked);
}
div.nav > header > a {
  padding: 0.5rem 1rem 1rem;
  font-family: 'Ink Free';
  font-size: var(--font-largest);
  text-transform: capitalize;
}

div.nav > ul {
  margin-bottom: 1rem;
}
div.nav > ul:last-child {
  margin-top: auto;
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

const HTML = `
<header>
  <a href="index.html">Flayground</a>
</header>
<ul>
  <li><a href="page.ground.html"      >ground</a></li>
  <li><a href="page.tags.html"        >tags</a></li>
  <li><a href="page.shot.history.html">shot history</a></li>
  <li><a href="page.statistics.html"  >statistics</a></li>
</ul>
<ul>
  <li><a href="page.image.html"       >image</a></li>
</ul>
<ul>
  <li><a href="page.kamoru.diary.html">diary</a></li>
</ul>
<ul>
  <li><a href="page.control.html"     >control</a></li>
  <li><a href="/swagger-ui/index.html">swagger</a></li>
  <li style="margin-top: 1rem;"><theme-controller/></li>
</ul>
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
  left: -200px;
  bottom: 0;
  width: 200px;
  transition: left 0.4s 0.4s;
  z-index: 74;
}

.nav-open:hover + side-nav, side-nav:hover {
  border-right: 1px solid var(--color-border);
  left: 0;
  transition: left 0.4s;
}
`;