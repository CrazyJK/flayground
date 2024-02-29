import { componentCss } from '../util/componentCssLoader';
import './part/ThemeController';

export default class SideNavBar extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.shadowRoot.innerHTML = HTML;

    this.shadowRoot.querySelectorAll('a').forEach((anker) => {
      if (anker.href.indexOf(location.pathname) > -1) {
        anker.parentElement.classList.add('active');
      }
    });

    this.shadowRoot.addEventListener('click', (e) => {
      console.debug('click', e.target.tagName);
      if (e.target.tagName === 'LI' || e.target.tagName === 'DIV') {
        this.classList.toggle('open');
      } else if (e.target.tagName === 'A') {
        const id = e.target.id;
        if (id === 'debug') {
          this.debug = !this.debug;
          document.documentElement.setAttribute('debug', this.debug);
        } else if (id === 'panda') {
          window.open('popup.panda-tv.html', Date.now(), `width=${window.innerWidth}px,height=${window.innerHeight}px'`);
        } else if (id === 'blank') {
          window.open('blank.html', Date.now(), `width=${window.innerWidth}px,height=${window.innerHeight}px'`);
        }
      }
    });

    const PAREMT_STYLE = this.parentElement.closest('html').querySelector('head').appendChild(document.createElement('style'));
    PAREMT_STYLE.innerHTML = PARENT_CSS;
    const NAV_OPEN = this.parentElement.insertBefore(document.createElement('label'), this);
    NAV_OPEN.classList.add('nav-open');
  }
}

// Define the new element
customElements.define('side-nav', SideNavBar);

const HTML = `
<style>
  ${componentCss}
  div.nav {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
  }
  div.nav > header {
    padding: 1rem;
  }
  div.nav > header.active > a {
    color: var(--color-checked);
  }
  div.nav > header > a {
    font-family: 'Ink Free';
    font-size: var(--size-largest);
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
</style>
<div class="nav">
  <header>
    <a href="index.html">flay ground</a>
  </header>
  <ul>
    <li><a href="page.flay-page.html">flay page</a></li>
    <li><a href="page.flay-one.html">flay one</a></li>
    <li><a href="page.flay-grid.html">flay grid</a></li>
  </ul>
  <ul>
    <li><a href="page.tags.html">tags</a></li>
    <li><a href="page.shot-history.html">shot history</a></li>
    <li><a href="page.statistics.html">statistics</a></li>
  </ul>
  <ul>
    <li><a href="page.image-page.html">image page</a></li>
    <li><a href="page.image-one.html">image one</a></li>
    <li><a href="page.image-grid.html">image grid</a></li>
  </ul>
  <ul>
    <li><a href="page.kamoru-diary.html">diary</a></li>
  </ul>
  <ul>
    <li><a href="page.develop.html">develop</a></li>
  </ul>
  <ul>
    <li><a href="javascript:" id="panda">Panda TV</a></li>
  </ul>
  <ul>
    <li><a href="javascript:" id="blank">blank</a></li>
  </ul>
  <ul>
    <li><a href="javascript:" id="debug">debug</a></li>
    <li><a href="page.control.html">control</a></li>
    <li><a href="/swagger-ui/index.html">swagger</a></li>
    <li style="margin-top: 1rem;"><theme-controller /></li>
  </ul>
</div>
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
