import { MODAL_EDGE, MODAL_MODE } from '@const/GroundConstant';
import FlayMonitor from '@flay/panel/FlayMonitor';
import { toggleDebug } from '@lib/DebugOutline';
import { ModalWindow } from '@ui/ModalWindow';
import FlayStorage from '../lib/FlayStorage';
import ThemeController from './part/ThemeController';
import './SideNavBar.scss';

const menuList = [
  { url: 'page.flay-page.html', name: 'flay page' },
  {},
  { url: 'page.flay-one.html', name: 'flay one' },
  { url: 'page.flay-grid.html', name: 'flay grid' },
  { url: 'page.archive.html', name: 'flay archive' },
  { url: 'page.flay-all.html', name: 'flay all' },
  { url: 'page.flay-pack.html', name: 'flay pack' },
  { url: 'page.cover-popout.html', name: 'cover pop' },
  { url: 'page.flay-tag.html', name: 'flay tag' },
  {},
  { url: 'page.flay-play.html', name: 'flay play' },
  { url: 'page.flay-play-record.html', name: 'play record' },
  { url: 'page.flay-basket.html', name: 'basket' },
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
  { url: 'page.image-page.html', name: 'image page' },
  { url: 'page.image-download.html', name: 'pic download' },
  {},
  { url: 'page.kamoru-diary.html', name: 'diary' },
  {},
  { url: 'page.dragndrop.html', name: 'drag & drop' },
  { url: 'style.html', name: 'style' },
  { url: 'test.html', name: 'test' },
];

export class SideNavBar extends HTMLElement {
  static readonly OPEN_STORAGE_KEY = 'SideNavBar.open';
  #currentMenuName: string = ''; // 현재 메뉴

  constructor() {
    super();

    this.classList.add('flay-div');
  }

  connectedCallback() {
    this.parentElement!.insertBefore(document.createElement('div'), this).classList.add('nav-open');

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
      <div><a id="memo">memo</a></div>
      <div><a id="debug">debug</a></div>
      <div><a id="swagger">swagger</a></div>
      <div><a id="dependencies">dependencies</a></div>
      <div><a id="bundleReport">bundle report</a></div>
    </footer>
    `;
    this.querySelector('footer')!.prepend(new FlayMonitor());
    this.querySelector('footer')!.appendChild(new ThemeController()).style.marginTop = '1rem';

    /** active 메뉴 표시 */
    this.querySelectorAll('a').forEach((anchor) => {
      if (anchor.href.includes(location.pathname)) {
        anchor.parentElement!.classList.add('active');
        this.#currentMenuName = anchor.textContent!.replace(/\s+/g, '');
      }
    });
    this.classList.toggle('open', FlayStorage.local.getBoolean(SideNavBar.OPEN_STORAGE_KEY, false));
    this.#setWindowSize();

    this.addEventListener('click', this.#menuClickHandler.bind(this));
    this.addEventListener('wheel', this.#wheelHandler.bind(this), { passive: true });
    this.addEventListener('resize', this.#setWindowSize.bind(this));
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#menuClickHandler.bind(this));
    this.removeEventListener('wheel', this.#wheelHandler.bind(this));
    this.removeEventListener('resize', this.#setWindowSize.bind(this));
  }

  #menuClickHandler(e: MouseEvent) {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const tagName = target.tagName;
    if (tagName === 'A') {
      const features = `width=${window.innerWidth}px,height=${window.innerHeight}px`;
      switch (target.id) {
        case 'memo':
          return this.#toggleMemoEditor();
        case 'debug':
          return toggleDebug();
        case 'swagger':
          return window.open('/swagger-ui/index.html', target.id, features);
        case 'dependencies':
          return window.open('dependencies-viewer.html', target.id, features);
        case 'bundleReport':
          return window.open('bundle-report.html', target.id, features);
        default:
          break;
      }
    } else if (target.closest('flay-monitor')) {
      window.open('popup.monitor.html', 'popup.monitor', 'width=1200,height=320');
    } else {
      const toggleState = this.classList.toggle('open');
      FlayStorage.local.set(SideNavBar.OPEN_STORAGE_KEY, toggleState.toString());
    }
  }

  #wheelHandler(e: WheelEvent) {
    e.stopPropagation();
  }

  #toggleMemoEditor() {
    const editorId = `memo-editor-${this.#currentMenuName}`;
    const memoEditor = document.getElementById(editorId);
    if (memoEditor) {
      memoEditor.remove();
      return;
    }

    void import(/* webpackChunkName: "FlayMemoEditor" */ '@flay/panel/FlayMemoEditor').then(({ FlayMemoEditor }) => {
      document.body
        .appendChild(
          new ModalWindow('Memo', {
            id: editorId,
            top: 60,
            left: 0,
            width: 300,
            height: 200,
            edges: [MODAL_EDGE.RIGHT],
            initialMode: MODAL_MODE.NORMAL,
          })
        )
        .appendChild(new FlayMemoEditor());
    });
  }

  #setWindowSize() {
    const debugLink = this.querySelector('#debug') as HTMLAnchorElement;
    if (debugLink) {
      debugLink.title = `${window.innerWidth} x ${window.innerHeight}`;
    }
  }
}

customElements.define('side-nav-bar', SideNavBar);
