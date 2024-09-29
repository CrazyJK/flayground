import '../flay/FlayMonitor';
import './part/ThemeController';
import './SideNavBar.scss';

const menuList = [
  { url: 'page.flay-page.html', name: 'flay page', module: 'FlayPage' },
  {},
  { url: 'page.flay-one.html', name: 'flay one', module: 'FlayOne' },
  { url: 'page.flay-grid.html', name: 'flay grid', module: 'FlayGrid' },
  {},
  { url: 'page.flay-basket.html', name: 'basket', module: 'FlayBasket' },
  {},
  { url: 'page.flay-play.html', name: 'flay play', module: 'FlayPlay' },
  { url: 'page.flay-play-history.html', name: 'play history', module: 'PlayHistory' },
  {},
  { url: 'page.archive.html', name: 'flay archive', module: 'FlayArchive' },
  {},
  { url: 'page.flay-girls.html', name: 'girls', module: 'FlayGirls' },
  { url: 'page.statistics.html', name: 'statistics' },
  { url: 'page.shot-history.html', name: 'shot history', module: 'ShotHistory' },
  {},
  { url: 'page.studio.html', name: 'studio', module: 'Studio' },
  { url: 'page.actress.html', name: 'actress', module: 'Actress' },
  { url: 'page.tags.html', name: 'tags', module: 'Tags' },
  {},
  { url: 'page.control.html', name: 'control', module: 'Control' },
  {},
  { url: 'page.image-one.html', name: 'image one' },
  { url: 'page.image-page.html', name: 'image page' },
  { url: 'page.image-fall.html', name: 'image fall' },
  {},
  { url: 'page.kamoru-diary.html', name: 'diary' },
  {},
  { url: 'page.dragndrop.html', name: 'drag & drop' },
  { url: 'style.html', name: 'style' },
];

export default class SideNavBar extends HTMLDivElement {
  debug = 0; // elememnts를 구분해서 보기 위한 조건

  constructor() {
    super();
    this.classList.add('side-nav-bar', 'open');
  }

  connectedCallback() {
    this.parentElement.insertBefore(document.createElement('label'), this).classList.add('nav-open');

    this.innerHTML = `
    <header>
      <div><a href="page.html">flay ground</a></div>
    </header>
    <article>
      ${menuList.map((menu) => (menu.url ? `<div class="menu"><a data-module="${menu.module}">${menu.name}</a><a onclick="window.open('${menu.url}', '${menu.name}', 'width=800,height=1000')">↗</a></div>` : '<div></div>')).join('')}
    </article>
    <footer>
      <div class="flay-monitor" is="flay-monitor"></div>
      <div><a id="debug">debug</a></div>
      <div><a id="swagger">swagger</a></div>
      <div><a id="dependencies">dependencies</a></div>
      <div><a id="bundleReport">bundle report</a></div>
      <div class="theme-controller" is="theme-controller" style="margin-top: 1rem;"></div>
    </footer>
    `;

    /** active 메뉴 표시 */
    this.querySelectorAll('a').forEach((anker) => {
      if (anker.href.indexOf(location.pathname) > -1) {
        anker.parentElement.classList.add('active');
      }
    });

    this.addEventListener('click', (e) => {
      const tagName = e.target.tagName;
      console.debug('click', tagName, e.target);
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
          case 'bundleReport':
            window.open('bundle-report.html', 'bundle-report', `width=${window.innerWidth}px,height=${window.innerHeight}px'`);
            break;
          default: {
            if (e.target.dataset?.module) {
              this.appendComponent(e.target.dataset.module);
            }
          }
        }
      } else if (e.target.closest('.flay-monitor')) {
        window.open('popup.monitor.html', 'popup.monitor', 'width=1200,height=320');
      } else {
        this.classList.toggle('open');
      }
    });
  }

  async appendComponent(moduleName) {
    console.log('appendModule', moduleName);
    const module = await getModule(moduleName);
    document.querySelector('body > main').replaceChildren(new module.default());
  }
}

// Define the new element
customElements.define('side-nav-bar', SideNavBar, { extends: 'div' });

async function getModule(name) {
  switch (name) {
    case 'FlayPage':
      return await import(/* webpackChunkName: "FlayPage" */ '../spa/FlayPage');
    case 'FlayOne':
      return await import(/* webpackChunkName: "FlayOne" */ '../spa/FlayOne');
    case 'FlayGrid':
      return await import(/* webpackChunkName: "FlayGrid" */ '../spa/FlayGrid');
    case 'FlayBasket':
      return await import(/* webpackChunkName: "FlayBasket" */ '../spa/FlayBasket');
    case 'FlayPlay':
      return await import(/* webpackChunkName: "FlayPlay" */ '../spa/FlayPlay');
    case 'PlayHistory':
      return await import(/* webpackChunkName: "PlayHistory" */ '../spa/PlayHistory');
    case 'FlayArchive':
      return await import(/* webpackChunkName: "FlayArchive" */ '../spa/FlayArchive');
    case 'FlayGirls':
      return await import(/* webpackChunkName: "FlayGirls" */ '../spa/FlayGirls');
  }
}
