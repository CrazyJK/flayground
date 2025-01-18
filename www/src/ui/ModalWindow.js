import './ModalWindow.scss';

import StringUtils from '../lib/StringUtils';
import { addResizeListener } from '../lib/windowAddEventListener';
import windowButton from '../svg/windowButton';

const OFFSET = 4;
const DEFAULT_OPTS = { top: 0, left: 0, width: 0, height: 0, minWidth: 200, minHeight: 100, edges: null };

export default class ModalWindow extends HTMLDivElement {
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

    const { top, left, width, height, minWidth, minHeight, edges } = { ...DEFAULT_OPTS, ...opts };
    this.#top = top;
    this.#left = left;
    this.#width = width;
    this.#height = height;
    this.#minWidth = minWidth;
    this.#minHeight = minHeight;
    this.dataset.edges = edges;

    this.classList.add('modal-window', 'flay-div');
    this.innerHTML = `
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

    this.#titleBar_______ = this.querySelector('.title-panel .title');
    this.#edgeTopLine____ = this.querySelector('.edge.top');
    this.#edgeLeftLine___ = this.querySelector('.edge.left');
    this.#edgeRightLine__ = this.querySelector('.edge.right');
    this.#edgeBottomLine_ = this.querySelector('.edge.bottom');
    this.#edgeTopLeft____ = this.querySelector('.edge.top-left');
    this.#edgeTopRight___ = this.querySelector('.edge.top-right');
    this.#edgeBottomLeft_ = this.querySelector('.edge.bottom-left');
    this.#edgeBottomRight = this.querySelector('.edge.bottom-right');

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

    this.querySelector('.title-panel .minimize').addEventListener('click', () => this.#minimizeHandler());
    this.querySelector('.title-panel .maximize').addEventListener('click', () => this.#maximizeHandler());
    this.querySelector('.title-panel .terminate').addEventListener('click', () => this.#terminateHandler());

    addResizeListener(() => this.#resizeWindowHandler());
  }

  connectedCallback() {
    this.#decideViewportInWindow();
    this.#setViewport();
  }

  #minimizeHandler() {
    this.classList.toggle('minimize');
  }

  #maximizeHandler() {
    this.classList.toggle('maximize');
  }

  #terminateHandler() {
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
    this.style.zIndex = ++ModalWindow.zIndex;
  }

  #stoptHandler(e) {
    this.#active = false;
    this.#mode = null;
    this.#decideViewportInWindow();
    this.#setViewport();
    this.classList.remove('floating');

    window.dispatchEvent(new Event('resize'));
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

  addContent(element) {
    this.querySelector('.body-panel').appendChild(element);
    return element;
  }

  getBodyPanel() {
    return this.querySelector('.body-panel');
  }

  setTitle(title) {
    this.querySelector('.title span').innerHTML = title;
  }
}

customElements.define('modal-window', ModalWindow, { extends: 'div' });
