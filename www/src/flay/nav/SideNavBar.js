import { MODAL_EDGE, MODAL_MODE } from '@/GroundConstant';
import { FlayMemoEditor } from '@flay/panel/FlayMemoEditor';
import '@flay/panel/FlayMonitor';
import { toggleDebug } from '@lib/DebugOutline';
import { addResizeListener } from '@lib/windowAddEventListener';
import { ModalWindow } from '@ui/ModalWindow';
import './part/ThemeController';
import './SideNavBar.scss';

const menuList = [
  { url: 'page.flay-page.html', name: 'flay page' },
  {},
  { url: 'page.flay-one.html', name: 'flay one' },
  { url: 'page.flay-grid.html', name: 'flay grid' },
  {},
  { url: 'page.flay-basket.html', name: 'basket' },
  { url: 'page.cover-popout.html', name: 'cover pop' },
  {},
  { url: 'page.flay-play.html', name: 'flay play' },
  { url: 'page.flay-play-record.html', name: 'play record' },
  {},
  { url: 'page.archive.html', name: 'flay archive' },
  {},
  { url: 'page.girls.html', name: 'girls' },
  { url: 'page.statistics.html', name: 'statistics' },
  { url: 'page.history-shot.html', name: 'shot history' },
  { url: 'page.history-play.html', name: 'play history' },
  {},
  { url: 'page.studio.html', name: 'studio' },
  { url: 'page.actress.html', name: 'actress' },
  { url: 'page.tags.html', name: 'tags' },
  {},
  { url: 'page.control.html', name: 'control' },
  { url: 'page.crawling.html', name: 'crawling' },
  {},
  { url: 'page.image-one.html', name: 'image one' },
  { url: 'page.image-page.html', name: 'image page' },
  { url: 'page.image-fall.html', name: 'image fall' },
  { url: 'popup.image.html', name: 'image pop' },
  {},
  { url: 'page.image-download.html', name: 'pic download' },
  {},
  { url: 'page.kamoru-diary.html', name: 'diary' },
  {},
  { url: 'page.dragndrop.html', name: 'drag & drop' },
  { url: 'style.html', name: 'style' },
  { url: 'test.html', name: 'test' },
];

export default class SideNavBar extends HTMLDivElement {
  #currentMenuName = null; // 현재 메뉴

  constructor() {
    super();
    this.classList.add('side-nav-bar', 'flay-div');
  }

  connectedCallback() {
    this.parentElement.insertBefore(document.createElement('label'), this).classList.add('nav-open');

    this.innerHTML = `
    <header>
      <div><a href="index.html">flay ground</a></div>
    </header>
    <article>
      ${menuList
        .map((menu) => {
          if (menu.url) {
            return `<div class="menu"><a href="${menu.url}">${menu.name}</a><a onclick="window.open('${menu.url}', '${menu.name}', 'width=800,height=1000')">↗</a></div>`;
          }
          return '<div></div>';
        })
        .join('')}
    </article>
    <footer>
      <div class="flay-monitor" is="flay-monitor"></div>
      <div class="window-size"></div>
      <div><a id="memo">memo</a></div>
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
        this.#currentMenuName = anker.textContent.replace(/\s+/g, '');
      }
    });

    this.addEventListener('click', (e) => {
      const tagName = e.target.tagName;
      console.debug('click', tagName);
      if (tagName === 'A') {
        switch (e.target.id) {
          case 'debug':
            toggleDebug();
            break;
          case 'dependencies':
            window.open('dependencies-viewer.html', 'dependencies-viewer', `width=${window.innerWidth}px,height=${window.innerHeight}px'`);
            break;
          case 'swagger':
            window.open('/swagger-ui/index.html', 'swagger', `width=${window.innerWidth}px,height=${window.innerHeight}px'`);
            break;
          case 'bundleReport':
            window.open('bundle-report.html', 'bundle-report', `width=${window.innerWidth}px,height=${window.innerHeight}px'`);
            break;
          case 'memo':
            this.#toggleMemoEditor();
            break;
        }
      } else if (e.target.closest('.flay-monitor')) {
        window.open('popup.monitor.html', 'popup.monitor', 'width=1200,height=320');
      } else {
        this.classList.toggle('open');
      }
    });

    this.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });

    addResizeListener(() => {
      const [width, height] = [window.innerWidth, window.innerHeight];
      this.querySelector('.window-size').innerHTML = `${width} x ${height}`;
    });
  }

  #toggleMemoEditor() {
    const memoEditor = document.querySelector('#memo-editor');
    if (memoEditor) {
      memoEditor.remove();
      return;
    }

    document
      .querySelector('body')
      .appendChild(
        new ModalWindow('Memo', {
          id: 'memo-editor-' + this.#currentMenuName,
          top: 60,
          left: 0,
          width: 300,
          height: 200,
          edges: [MODAL_EDGE.RIGHT],
          initialMode: MODAL_MODE.NORMAL,
        })
      )
      .appendChild(new FlayMemoEditor());
  }
}

customElements.define('side-nav-bar', SideNavBar, { extends: 'div' });
