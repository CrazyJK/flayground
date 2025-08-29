import GroundNav from '@base/GroundNav';
import '@flay/panel/FlayMonitor';
import { toggleDebug } from '@lib/DebugOutline';
import FlayStorage from '@lib/FlayStorage';
import { ModalWindow } from '@ui/ModalWindow';
import './part/ThemeController';
import './SideNavBar.scss';

type MenuItemType =
  | {
      url: string;
      name: string;
    }
  | {};

class SideNavOpener extends GroundNav {}
customElements.define('side-nav-opener', SideNavOpener);

export class SideNavBar extends GroundNav {
  static readonly OPEN_STORAGE_KEY = 'SideNavBar.open';

  // 정적 메뉴 리스트를 클래스 속성으로 이동
  static readonly #MENU_LIST: readonly MenuItemType[] = [
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

  /**
   * 메뉴 아이템이 유효한 메뉴인지 확인하는 타입 가드
   */
  static #isValidMenuItem(menu: MenuItemType): menu is { url: string; name: string } {
    return 'url' in menu && 'name' in menu;
  }

  // 이벤트 핸들러들을 바인딩된 형태로 저장
  #boundMenuClickHandler: (e: MouseEvent) => void;
  #boundWheelHandler: (e: WheelEvent) => void;
  #boundSetWindowSize: () => void;

  #currentMenuName: string = ''; // 현재 메뉴
  #windowSizeIndicator: HTMLElement; // DOM 요소 캐싱

  constructor() {
    super();

    // 이벤트 핸들러 바인딩을 생성자에서 한 번만 수행
    this.#boundMenuClickHandler = this.#menuClickHandler.bind(this);
    this.#boundWheelHandler = this.#wheelHandler.bind(this);
    this.#boundSetWindowSize = this.#setWindowSize.bind(this);

    // 메뉴 HTML을 미리 생성하여 캐싱
    const menuHTML = this.#generateMenuHTML();

    this.innerHTML = `
    <header>
      <div><a href="index.html">flay ground</a></div>
    </header>
    <article>
      ${menuHTML}
    </article>
    <footer>
      <div><flay-monitor></flay-monitor></div>
      <div><a id="memo">memo</a></div>
      <div><a id="debug">debug</a><i></i></div>
      <div><a id="swagger">swagger</a></div>
      <div><a id="dependencies">dependencies</a></div>
      <div><a id="bundleReport">bundle report</a></div>
      <div><theme-controller style="margin-top: 1rem;"></theme-controller></div>
    </footer>
    `;

    // DOM 요소 캐싱
    this.#windowSizeIndicator = this.querySelector('#debug + i')!;
  }

  connectedCallback() {
    this.parentElement!.insertBefore(new SideNavOpener(), this);

    this.#setActiveMenu();
    this.#setWindowSize();
    this.classList.toggle('open', FlayStorage.local.getBoolean(SideNavBar.OPEN_STORAGE_KEY, false));

    this.addEventListener('click', this.#boundMenuClickHandler);
    this.addEventListener('wheel', this.#boundWheelHandler, { passive: true });
    window.addEventListener('resize', this.#boundSetWindowSize);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#boundMenuClickHandler);
    this.removeEventListener('wheel', this.#boundWheelHandler);
    window.removeEventListener('resize', this.#boundSetWindowSize);
  }

  /**
   * 메뉴 HTML 템플릿 생성
   */
  #generateMenuHTML(): string {
    return SideNavBar.#MENU_LIST
      .map((menu) => {
        if (SideNavBar.#isValidMenuItem(menu)) {
          return `<div class="menu"><a href="${menu.url}">${menu.name}</a><a onclick="window.open('${menu.url}', '${menu.name}', 'width=800,height=1000')">↗</a></div>`;
        }
        return '<div class="gap"></div>';
      })
      .join('');
  }

  /**
   * 활성 메뉴 설정 (성능을 위해 분리)
   */
  #setActiveMenu(): void {
    const anchors = this.querySelectorAll('a');
    for (const anchor of anchors) {
      if (anchor.href.includes(location.pathname)) {
        anchor.parentElement!.classList.add('active');
        this.#currentMenuName = anchor.textContent!.replace(/\s+/g, '');
        break; // 첫 번째 매치에서 중단
      }
    }
  }

  /**
   * footer 메뉴 클릭 핸들러
   * @param e 클릭 이벤트
   */
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
      window.open('popup.monitor.html', 'popup.monitor', 'width=1200,height=410');
    } else {
      const toggleState = this.classList.toggle('open');
      FlayStorage.local.set(SideNavBar.OPEN_STORAGE_KEY, toggleState.toString());
    }
  }

  /**
   * 휠 이벤트 핸들러
   * @param e 휠 이벤트
   */
  #wheelHandler(e: WheelEvent) {
    e.stopPropagation();
  }

  /**
   * 메모 편집기 토글
   */
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
            edges: [ModalWindow.EDGE.RIGHT],
            initialMode: ModalWindow.MODE.NORMAL,
          })
        )
        .appendChild(new FlayMemoEditor());
    });
  }

  /**
   * 윈도우 크기 설정
   */
  #setWindowSize() {
    this.#windowSizeIndicator.innerHTML = ` ${window.innerWidth} x ${window.innerHeight}`;
  }
}

customElements.define('side-nav-bar', SideNavBar);
