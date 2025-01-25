import { EVENT_CHANGE_TITLE } from '../GroundConstant';
import StringUtils from '../lib/StringUtils';
import { addResizeListener } from '../lib/windowAddEventListener';
import windowButton from '../svg/windowButton';

const cssText = `
  :host {
    position: absolute;
    overflow: visible;
    -webkit-tap-highlight-color: transparent;
    pointer-events: auto;
    z-index: 13;
    border-radius: 4px;
    box-shadow: var(--box-shadow-smallest);
    transition: box-shadow 0.4s;
  }
  :host:hover {

  }

  :host(.floating) {
    box-shadow: var(--box-shadow);
  }
  :host(.floating) .edges {
    position: relative;
  }
  :host(.floating) .edges .edge {
    position: fixed;
    z-index: 2;
  }
  :host(.floating) .inner .title-panel .title {
    z-index: 2;
  }
  :host(.floating) .inner .title-panel .title span,
  :host(.floating) .inner .title-panel .buttons .btn {
    color: var(--color-text);
  }
  :host(.floating) .inner .body-panel {
    z-index: 0;
  }
  :host(.floating) .outer {
    position: fixed;
    inset: 0;
    background-color: transparent;
    z-index: 1;
  }

  :host(.maximize) {
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100vh !important;
  }
  :host(.maximize) .edges {
    display: none;
  }

  :host(.minimize) {
    height: 2rem !important;
  }
  :host(.minimize) .edges {
    display: none;
  }

  :host(.debugging) .edges .edge {
    background-color: #0f0a;
  }
  :host(.debugging) .edges .edge.top-left,
  :host(.debugging) .edges .edge.bottom-right,
  :host(.debugging) .edges .edge.top-right,
  :host(.debugging) .edges .edge.bottom-left {
    background-color: #f00a;
  }
  :host(.debugging) .inner .title-panel .title {
    background-color: #0f0a;
  }
  :host(.debugging) .outer {
    background-color: #f003;
  }

  .edges {
    position: fixed;
    top: 0px;
    left: 0px;
    height: 0px;
    width: 0px;
    overflow: visible;
    -webkit-tap-highlight-color: transparent;
    z-index: 1;
  }
  .edges .edge {
    position: absolute;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
  }
  .edges .edge.top,
  .edges .edge.bottom {
    cursor: ns-resize;
    height: 8px;
  }
  .edges .edge.left,
  .edges .edge.right {
    cursor: ew-resize;
    width: 8px;
  }
  .edges .edge.top-left,
  .edges .edge.bottom-right {
    cursor: nwse-resize;
    height: 8px;
    width: 8px;
  }
  .edges .edge.top-right,
  .edges .edge.bottom-left {
    cursor: nesw-resize;
    height: 8px;
    width: 8px;
  }

  .inner {
    position: absolute;
    height: calc(100% - 4px);
    width: calc(100% - 4px);
    background-color: var(--color-bg-window);
    margin: 0;
    border: 2px solid var(--color-border-window);
    border-radius: 4px;
    display: grid;
    grid-template-rows: 2rem 1fr;
  }
  .inner .title-panel {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-bottom: 1px solid var(--color-border-window);
    border-radius: 2px 2px 0px 0px;
    display: flex;
    justify-content: space-between;
  }
  .inner .title-panel .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: move;
    flex-grow: 1;
    height: 100%;
    padding: 3px 3px 3px 8px;
    z-index: 1;
  }
  .inner .title-panel .title span {
    color: var(--color-text-window);
    font-weight: 700;
    font-size: var(--size-small);
  }
  .inner .title-panel .buttons {
    display: flex;
    gap: 0.5rem;
    padding: 0 0.25rem;
  }
  .inner .title-panel .buttons .btn {
    background-color: transparent;
    border: 0;
    color: var(--color-text-window);
    cursor: pointer;
  }
  .inner .title-panel .buttons .btn svg {
    width: 1.25rem;
  }
  .inner .title-panel .buttons .btn:hover svg {
    color: var(--color-orange);
  }
  .inner .body-panel {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden auto;
    -webkit-tap-highlight-color: transparent;
    border-bottom-right-radius: 2px;
    border-bottom-left-radius: 2px;
  }
`;

const OFFSET = 4;
const DEFAULT_OPTS = { top: 0, left: 0, width: 0, height: 0, minWidth: 200, minHeight: 100, edges: null, initialMode: 'normal' };

export default class ModalShadowWindow extends HTMLElement {
  static zIndex = 13;

  #top;
  #left;
  #width;
  #height;
  #minWidth;
  #minHeight;

  #prevClientX = 0;
  #prevClientY = 0;
  #mode;
  #active = false;

  #titleBar_______;
  #edgeTopLine____;
  #edgeLeftLine___;
  #edgeRightLine__;
  #edgeBottomLine_;
  #edgeTopLeft____;
  #edgeTopRight___;
  #edgeBottomLeft_;
  #edgeBottomRight;

  /**
   *
   * @param {string} title 창제목
   * @param {DEFAULT_OPTS} opts 옵션.
   */
  constructor(title = '', opts = {}) {
    super();

    this.attachShadow({ mode: 'open' });

    const { top, left, width, height, minWidth, minHeight, edges, initialMode } = { ...DEFAULT_OPTS, ...opts };
    this.#top = top;
    this.#left = left;
    this.#width = width;
    this.#height = height;
    this.#minWidth = minWidth;
    this.#minHeight = minHeight;
    this.dataset.edges = edges;
    this.classList.add(initialMode);
    this.classList.add('modal-shadow-window', 'flay-div');

    this.shadowRoot.innerHTML = `
      <style>${cssText}</style>
      <div class="edges">
        <div class="edge top"></div>
        <div class="edge left"></div>
        <div class="edge right"></div>
        <div class="edge bottom"></div>
        <div class="edge top-left"></div>
        <div class="edge top-right"></div>
        <div class="edge bottom-left"></div>
        <div class="edge bottom-right"></div>
      </div>
      <div class="inner">
        <div class="title-panel">
          <div class="title">
            <span>${title}</span>
          </div>
          <div class="buttons">
            <button type="button" class="btn minimize" title="말기">${windowButton.minimize}</button>
            <button type="button" class="btn maximize" title="최대화">${windowButton.maximize}</button>
            <button type="button" class="btn terminate" title="닫기">${windowButton.terminate}</button>
          </div>
        </div>
        <div class="body-panel">
        </div>
      </div>
      <div class="outer"></div>
    `;

    this.#titleBar_______ = this.shadowRoot.querySelector('.title-panel .title');
    this.#edgeTopLine____ = this.shadowRoot.querySelector('.edge.top');
    this.#edgeLeftLine___ = this.shadowRoot.querySelector('.edge.left');
    this.#edgeRightLine__ = this.shadowRoot.querySelector('.edge.right');
    this.#edgeBottomLine_ = this.shadowRoot.querySelector('.edge.bottom');
    this.#edgeTopLeft____ = this.shadowRoot.querySelector('.edge.top-left');
    this.#edgeTopRight___ = this.shadowRoot.querySelector('.edge.top-right');
    this.#edgeBottomLeft_ = this.shadowRoot.querySelector('.edge.bottom-left');
    this.#edgeBottomRight = this.shadowRoot.querySelector('.edge.bottom-right');

    this.#titleBar_______.addEventListener('mousedown', (e) => this.#startHandler(e, 'move'));
    this.#edgeTopLine____.addEventListener('mousedown', (e) => this.#startHandler(e, 'top'));
    this.#edgeLeftLine___.addEventListener('mousedown', (e) => this.#startHandler(e, 'left'));
    this.#edgeRightLine__.addEventListener('mousedown', (e) => this.#startHandler(e, 'right'));
    this.#edgeBottomLine_.addEventListener('mousedown', (e) => this.#startHandler(e, 'bottom'));
    this.#edgeTopLeft____.addEventListener('mousedown', (e) => this.#startHandler(e, 'top-left'));
    this.#edgeTopRight___.addEventListener('mousedown', (e) => this.#startHandler(e, 'top-right'));
    this.#edgeBottomLeft_.addEventListener('mousedown', (e) => this.#startHandler(e, 'bottom-left'));
    this.#edgeBottomRight.addEventListener('mousedown', (e) => this.#startHandler(e, 'bottom-right'));

    this.#titleBar_______.addEventListener('mouseup', (e) => this.#stoptHandler(e));
    this.#edgeTopLine____.addEventListener('mouseup', (e) => this.#stoptHandler(e));
    this.#edgeLeftLine___.addEventListener('mouseup', (e) => this.#stoptHandler(e));
    this.#edgeRightLine__.addEventListener('mouseup', (e) => this.#stoptHandler(e));
    this.#edgeBottomLine_.addEventListener('mouseup', (e) => this.#stoptHandler(e));
    this.#edgeTopLeft____.addEventListener('mouseup', (e) => this.#stoptHandler(e));
    this.#edgeTopRight___.addEventListener('mouseup', (e) => this.#stoptHandler(e));
    this.#edgeBottomLeft_.addEventListener('mouseup', (e) => this.#stoptHandler(e));
    this.#edgeBottomRight.addEventListener('mouseup', (e) => this.#stoptHandler(e));

    document.addEventListener('mouseup', (e) => this.#stoptHandler(e));
    document.addEventListener('mousemove', (e) => this.#moveHandler(e));

    this.shadowRoot.querySelector('.title-panel .minimize').addEventListener('click', () => this.#minimizeHandler());
    this.shadowRoot.querySelector('.title-panel .maximize').addEventListener('click', () => this.#maximizeHandler());
    this.shadowRoot.querySelector('.title-panel .terminate').addEventListener('click', () => this.#terminateHandler());

    this.addEventListener('mousedown', () => (this.style.zIndex = ++ModalShadowWindow.zIndex));

    this.addEventListener('wheel', (e) => e.stopPropagation());
    this.addEventListener('keyup', (e) => e.stopPropagation());

    addResizeListener(() => this.#resizeWindowHandler());
  }

  connectedCallback() {
    this.#decideViewportInWindow();
    this.#setViewport();
  }

  appendChild(element) {
    element.addEventListener(EVENT_CHANGE_TITLE, (e) => (this.windowTitle = e.detail.title));
    this.shadowRoot.querySelector('.body-panel').appendChild(element);
    return element;
  }

  set windowTitle(title) {
    this.shadowRoot.querySelector('.title span').innerHTML = title;
  }

  get windowTitle() {
    return this.shadowRoot.querySelector('.title span').textContent;
  }

  #minimizeHandler() {
    this.classList.toggle('minimize');
    this.dispatchEvent(new Event('resize', { bubbles: true }));
  }

  #maximizeHandler() {
    this.classList.toggle('maximize');
    this.dispatchEvent(new Event('resize', { bubbles: true }));
  }

  #terminateHandler() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
    this.remove();
  }

  #resizeWindowHandler() {
    this.#decideViewportInWindow();
    this.#setViewport();
  }

  #startHandler(e, mode) {
    this.#active = true;
    this.#mode = mode;
    this.#prevClientX = e.clientX;
    this.#prevClientY = e.clientY;
    this.classList.add('floating');
  }

  #stoptHandler(e) {
    this.#active = false;
    this.#mode = null;
    this.#decideViewportInWindow();
    this.#setViewport();
    this.classList.remove('floating');
  }

  #moveHandler(e) {
    if (e.buttons !== 1) return;
    if (!this.#active) return;

    this.#mode.split('-').forEach((mode) => {
      switch (mode) {
        case 'move':
          this.#top += e.clientY - this.#prevClientY;
          this.#left += e.clientX - this.#prevClientX;
          break;
        case 'top':
          this.#top += e.clientY - this.#prevClientY;
          this.#height -= e.clientY - this.#prevClientY;
          break;
        case 'bottom':
          this.#height += e.clientY - this.#prevClientY;
          break;
        case 'left':
          this.#left += e.clientX - this.#prevClientX;
          this.#width -= e.clientX - this.#prevClientX;
          break;
        case 'right':
          this.#width += e.clientX - this.#prevClientX;
          break;
      }
    });

    this.dataset.edges = ''; // 움직였으면 엣지 해제
    this.#setViewport();

    this.#prevClientX = e.clientX;
    this.#prevClientY = e.clientY;

    if (this.#mode !== 'move') this.dispatchEvent(new Event('resize', { bubbles: true }));
  }

  /**
   * 화면 밖으로 나가지 않도록 하거나, 코너 위치가 정해졌다면 그 위치를 조정
   */
  #decideViewportInWindow() {
    this.#width = Math.min(this.#width, window.innerWidth - OFFSET * 2); // 너무 넓은가
    this.#width = Math.max(this.#width, this.#minWidth); // 너무 좁은가
    this.#height = Math.min(this.#height, window.innerHeight - OFFSET * 2); // 너무 높은가
    this.#height = Math.max(this.#height, this.#minHeight); // 너무 작은가

    if (this.#width > this.#minWidth) {
      this.#top = Math.min(this.#top, window.innerHeight - this.#height - OFFSET); // 너무 아래 있는가
      this.#top = Math.max(this.#top, OFFSET); // 너무 높이 있는가
    }

    if (this.#height > this.#minHeight) {
      this.#left = Math.min(this.#left, window.innerWidth - this.#width - OFFSET); // 너무 왼쪽에 있느가
      this.#left = Math.max(this.#left, OFFSET); // 너무 오른쪽에 있는가
    }

    // 코너에 붙어있는지 결정
    if (StringUtils.isBlank(this.dataset.edges)) {
      const edges = [];
      if (this.#top === OFFSET) edges.push('top');
      if (this.#left === OFFSET) edges.push('left');
      if (this.#left === window.innerWidth - this.#width - OFFSET) edges.push('right');
      if (this.#top === window.innerHeight - this.#height - OFFSET) edges.push('bottom');
      this.dataset.edges = edges.join(',');
    }

    this.dataset.edges.split(',').forEach((edge) => {
      switch (edge) {
        case 'top':
          this.#top = OFFSET;
          break;
        case 'bottom':
          this.#top = window.innerHeight - this.#height - OFFSET;
          break;
        case 'left':
          this.#left = OFFSET;
          break;
        case 'right':
          this.#left = window.innerWidth - this.#width - OFFSET;
          break;
      }
    });
  }

  /**
   * 정해진 위치와 크기로 창 조정
   */
  #setViewport() {
    this.style.top = this.#top + 'px';
    this.style.left = this.#left + 'px';
    this.style.width = this.#width + 'px';
    this.style.height = this.#height + 'px';

    this.#edgeTopLine____.style.cssText = `top: ${this.#top - OFFSET}px;                left: ${this.#left}px;                          width: ${this.#width}px;`;
    this.#edgeBottomLine_.style.cssText = `top: ${this.#top + this.#height - OFFSET}px; left: ${this.#left}px;                          width: ${this.#width}px;`;
    this.#edgeLeftLine___.style.cssText = `top: ${this.#top}px;                         left: ${this.#left - OFFSET}px;                        height: ${this.#height}px;`;
    this.#edgeRightLine__.style.cssText = `top: ${this.#top}px;                         left: ${this.#left + this.#width - OFFSET}px;          height: ${this.#height}px;`;
    this.#edgeTopLeft____.style.cssText = `top: ${this.#top - OFFSET}px;                left: ${this.#left - OFFSET}px;`;
    this.#edgeTopRight___.style.cssText = `top: ${this.#top - OFFSET}px;                left: ${this.#left + this.#width - OFFSET}px;`;
    this.#edgeBottomLeft_.style.cssText = `top: ${this.#top + this.#height - OFFSET}px; left: ${this.#left - OFFSET}px;`;
    this.#edgeBottomRight.style.cssText = `top: ${this.#top + this.#height - OFFSET}px; left: ${this.#left + this.#width - OFFSET}px;`;
  }
}

customElements.define('modal-shadow-window', ModalShadowWindow);
