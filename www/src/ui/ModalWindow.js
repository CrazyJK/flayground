import './ModalWindow.scss';

import { EVENT_CHANGE_TITLE, MODAL_EDGE, MODAL_MODE, nextWindowzIndex } from '../GroundConstant';
import { addResizeListener } from '../lib/windowAddEventListener';
import windowButton from '../svg/windowButton';

const OFFSET = 4; // 창의 가장자리 여백
const DEFAULT_OPTS = { top: 0, left: 0, width: 0, height: 0, minWidth: 200, minHeight: 100, edges: [], initialMode: MODAL_MODE.NORMAL }; // 창의 기본 옵션

export default class ModalWindow extends HTMLDivElement {
  #top = 0; // 창의 상단 위치
  #left = 0; // 창의 좌측 위치
  #width = 0; // 창의 너비
  #height = 0; // 창의 높이
  #minWidth = 0; // 창의 최소 너비
  #minHeight = 0; // 창의 최소 높이
  #edges = []; // 창의 위치를 고정시킬 엣지
  #initialMode = MODAL_MODE.NORMAL; // 창의 초기 모드

  #prevHeight = 0; // 창의 이전 높이
  #prevMinHeight = 0; // 창의 이전 최소 높이
  #prevClientX = 0; // 이전 클릭 위치
  #prevClientY = 0; // 이전 클릭 위치
  #containsEdgesCenter = false; // 엣지에 center가 포함되어 있는가

  #mode = ''; // 창의 동작 모드. 'move', 'top', 'left', 'right', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  #active = false; // 창의 동작 여부

  #titleSpan; // 창의 제목
  #bodyPanel; // 창의 내용. 여기에 appendChild로 추가된 요소가 들어감
  #buttons; // 창의 버튼

  #titleBar_______; // 창의 타이틀
  #edgeTopLine____; // 창의 상단 엣지
  #edgeLeftLine___; // 창의 좌측 엣지
  #edgeRightLine__; // 창의 우측 엣지
  #edgeBottomLine_; // 창의 하단 엣지
  #edgeTopLeft____; // 창의 상단 좌측 엣지
  #edgeTopRight___; // 창의 상단 우측 엣지
  #edgeBottomLeft_; // 창의 하단 좌측 엣지
  #edgeBottomRight; // 창의 하단 우측 엣지

  /**
   *
   * @param {string} title 창제목
   * @param {DEFAULT_OPTS} opts 옵션.
   */
  constructor(title = '', opts = {}) {
    super();

    const { top, left, width, height, minWidth, minHeight, edges, initialMode } = { ...DEFAULT_OPTS, ...opts };
    this.#top = top;
    this.#left = left;
    this.#width = width;
    this.#height = height;
    this.#minWidth = minWidth;
    this.#minHeight = minHeight;
    this.#edges = edges;
    this.#initialMode = initialMode;

    this.classList.add('modal-window', 'flay-div');
    this.innerHTML = `
      <div class="edges">
        <div class="edge ${MODAL_EDGE.TOP}"></div>
        <div class="edge ${MODAL_EDGE.LEFT}"></div>
        <div class="edge ${MODAL_EDGE.RIGHT}"></div>
        <div class="edge ${MODAL_EDGE.BOTTOM}"></div>
        <div class="edge ${MODAL_EDGE.TOP_LEFT}"></div>
        <div class="edge ${MODAL_EDGE.TOP_RIGHT}"></div>
        <div class="edge ${MODAL_EDGE.BOTTOM_LEFT}"></div>
        <div class="edge ${MODAL_EDGE.BOTTOM_RIGHT}"></div>
      </div>
      <div class="inner">
        <div class="title-panel">
          <div class="title">
            <span>${title}</span>
          </div>
          <div class="buttons">
            <button type="button" class="btn ${MODAL_MODE.MINIMIZE}" title="말기">${windowButton.minimize}</button>
            <button type="button" class="btn ${MODAL_MODE.MAXIMIZE}" title="최대화">${windowButton.maximize}</button>
            <button type="button" class="btn ${MODAL_MODE.TERMINATE}" title="닫기">${windowButton.terminate}</button>
          </div>
        </div>
        <div class="body-panel">
        </div>
      </div>
      <div class="outer"></div>
    `;

    const _edges = this.querySelector('.edges');
    const _inner = this.querySelector('.inner');

    this.#titleSpan = _inner.querySelector('.title span');
    this.#bodyPanel = _inner.querySelector('.body-panel');
    this.#buttons = _inner.querySelector('.buttons');

    this.#titleBar_______ = _inner.querySelector('.title');
    this.#edgeTopLine____ = _edges.querySelector('.edge.' + MODAL_EDGE.TOP);
    this.#edgeLeftLine___ = _edges.querySelector('.edge.' + MODAL_EDGE.LEFT);
    this.#edgeRightLine__ = _edges.querySelector('.edge.' + MODAL_EDGE.RIGHT);
    this.#edgeBottomLine_ = _edges.querySelector('.edge.' + MODAL_EDGE.BOTTOM);
    this.#edgeTopLeft____ = _edges.querySelector('.edge.' + MODAL_EDGE.TOP_LEFT);
    this.#edgeTopRight___ = _edges.querySelector('.edge.' + MODAL_EDGE.TOP_RIGHT);
    this.#edgeBottomLeft_ = _edges.querySelector('.edge.' + MODAL_EDGE.BOTTOM_LEFT);
    this.#edgeBottomRight = _edges.querySelector('.edge.' + MODAL_EDGE.BOTTOM_RIGHT);

    this.#titleBar_______.addEventListener('mousedown', (e) => this.#startHandler(e, 'move'));
    this.#edgeTopLine____.addEventListener('mousedown', (e) => this.#startHandler(e, MODAL_EDGE.TOP));
    this.#edgeLeftLine___.addEventListener('mousedown', (e) => this.#startHandler(e, MODAL_EDGE.LEFT));
    this.#edgeRightLine__.addEventListener('mousedown', (e) => this.#startHandler(e, MODAL_EDGE.RIGHT));
    this.#edgeBottomLine_.addEventListener('mousedown', (e) => this.#startHandler(e, MODAL_EDGE.BOTTOM));
    this.#edgeTopLeft____.addEventListener('mousedown', (e) => this.#startHandler(e, MODAL_EDGE.TOP_LEFT));
    this.#edgeTopRight___.addEventListener('mousedown', (e) => this.#startHandler(e, MODAL_EDGE.TOP_RIGHT));
    this.#edgeBottomLeft_.addEventListener('mousedown', (e) => this.#startHandler(e, MODAL_EDGE.BOTTOM_LEFT));
    this.#edgeBottomRight.addEventListener('mousedown', (e) => this.#startHandler(e, MODAL_EDGE.BOTTOM_RIGHT));

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

    _inner.querySelector('.' + MODAL_MODE.MINIMIZE).addEventListener('click', () => this.#minimizeHandler());
    _inner.querySelector('.' + MODAL_MODE.MAXIMIZE).addEventListener('click', () => this.#maximizeHandler());
    _inner.querySelector('.' + MODAL_MODE.TERMINATE).addEventListener('click', () => this.#terminateHandler());

    this.addEventListener('mousedown', () => (this.style.zIndex = nextWindowzIndex()));

    this.addEventListener('wheel', (e) => e.stopPropagation());
    this.addEventListener('keyup', (e) => e.stopPropagation());

    addResizeListener(() => this.#resizeWindowHandler());
  }

  connectedCallback() {
    this.#decideViewportInWindow();
    this.#setViewport();
    this.#buttons.querySelector('.' + this.#initialMode)?.click();
  }

  appendChild(element) {
    element.addEventListener(EVENT_CHANGE_TITLE, (e) => (this.windowTitle = e.detail.title));
    this.#bodyPanel.appendChild(element);
    return element;
  }

  set windowTitle(title) {
    this.#titleSpan.innerHTML = title;
  }

  get windowTitle() {
    return this.#titleSpan.textContent;
  }

  #minimizeHandler() {
    if (this.classList.toggle(MODAL_MODE.MINIMIZE)) {
      this.#prevHeight = this.#height;
      this.#height = this.clientHeight;
      this.#prevMinHeight = this.#minHeight;
      this.#minHeight = this.clientHeight;

      if (this.#edges.includes(MODAL_EDGE.CENTER)) {
        this.#containsEdgesCenter = true;
        this.#edges = this.#edges.filter((edge) => edge !== MODAL_EDGE.CENTER);
      }
    } else {
      this.#height = this.#prevHeight;
      this.#minHeight = this.#prevMinHeight;
      if (this.#containsEdgesCenter) this.#edges.push(MODAL_EDGE.CENTER);
    }
    this.dispatchEvent(new Event('resize', { bubbles: true }));
  }

  #maximizeHandler() {
    this.classList.toggle(MODAL_MODE.MAXIMIZE);
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
        case MODAL_EDGE.TOP:
          this.#top += e.clientY - this.#prevClientY;
          this.#height -= e.clientY - this.#prevClientY;
          break;
        case MODAL_EDGE.BOTTOM:
          this.#height += e.clientY - this.#prevClientY;
          break;
        case MODAL_EDGE.LEFT:
          this.#left += e.clientX - this.#prevClientX;
          this.#width -= e.clientX - this.#prevClientX;
          break;
        case MODAL_EDGE.RIGHT:
          this.#width += e.clientX - this.#prevClientX;
          break;
      }
    });

    this.#edges = []; // 움직였으면 엣지 해제
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
    if (this.#edges.length === 0) {
      if (this.#top === OFFSET) this.#edges.push(MODAL_EDGE.TOP);
      if (this.#left === OFFSET) this.#edges.push(MODAL_EDGE.LEFT);
      if (this.#left === window.innerWidth - this.#width - OFFSET) this.#edges.push(MODAL_EDGE.RIGHT);
      if (this.#top === window.innerHeight - this.#height - OFFSET) this.#edges.push(MODAL_EDGE.BOTTOM);
    }

    this.#edges.forEach((edge) => {
      switch (edge) {
        case MODAL_EDGE.TOP:
          this.#top = OFFSET;
          if (this.#edges.includes(MODAL_EDGE.BOTTOM)) this.#height = window.innerHeight - OFFSET * 2;
          break;
        case MODAL_EDGE.BOTTOM:
          this.#top = window.innerHeight - this.#height - OFFSET;
          if (this.#edges.includes(MODAL_EDGE.TOP)) this.#height = window.innerHeight - OFFSET * 2;
          break;
        case MODAL_EDGE.LEFT:
          this.#left = OFFSET;
          if (this.#edges.includes(MODAL_EDGE.RIGHT)) this.#width = window.innerWidth - OFFSET * 2;
          break;
        case MODAL_EDGE.RIGHT:
          this.#left = window.innerWidth - this.#width - OFFSET;
          if (this.#edges.includes(MODAL_EDGE.LEFT)) this.#width = window.innerWidth - OFFSET * 2;
          break;
        case MODAL_EDGE.CENTER:
          this.#top = (window.innerHeight - this.#height) / 2;
          this.#left = (window.innerWidth - this.#width) / 2;
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

customElements.define('modal-window', ModalWindow, { extends: 'div' });
