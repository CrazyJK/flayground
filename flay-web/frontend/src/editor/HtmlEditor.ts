/**
 * 메모용 최소 WYSIWYG HTML 에디터 커스텀 엘리먼트 — 외부 라이브러리 없이 contenteditable 로 구현.
 *
 * 메모는 "URL 몇 줄 + 글자색" 이 전부라 브라우저 내장 편집(contenteditable + execCommand)으로 충분하다.
 * 입출력은 innerHTML 그대로(HTML 파일 저장 형식과 동일), 붙여넣기는 plain text 로 정규화한다.
 *
 * 공개 API·이벤트 이름:
 *   getEditorHTML() / setEditorHTML(html, append) / hide() / show()
 *   이벤트 editor-load · editor-change · editor-blur (+ 생성자 콜백 { load, blur, change })
 */
import GroundEditor from '@base/GroundEditor';
import './HtmlEditor.scss';

export const DEFAULT_CALLBACK = { load: () => {}, blur: () => {}, change: () => {} };

/** 글자색 팔레트 (프리셋). 뒤에 커스텀 색 입력이 붙는다 */
const COLOR_PRESETS = ['#f85149', '#f7ca88', '#3fb950', '#58a6ff', '#bc8cff', '#f778ba'];

export class HtmlEditor extends GroundEditor {
  /** 에디터 로드 이벤트 */
  static readonly EVENT_EDITOR_LOAD = 'editor-load';
  /** 에디터를 벗어나는 이벤트 */
  static readonly EVENT_EDITOR_BLUR = 'editor-blur';
  /** 에디터 내용이 변경되는 이벤트 */
  static readonly EVENT_EDITOR_CHANGE = 'editor-change';

  #toolbar!: HTMLDivElement;
  #content!: HTMLDivElement;
  #loadCallback: () => void;
  #blurCallback: () => void;
  #changeCallback: () => void;

  /**
   * @param callbackFunctions load/blur/change 콜백 (이벤트로도 동일하게 통지)
   */
  constructor(callbackFunctions: Partial<typeof DEFAULT_CALLBACK> = {}) {
    super();
    const { load, blur, change } = { ...DEFAULT_CALLBACK, ...callbackFunctions };
    this.#loadCallback = load;
    this.#blurCallback = blur;
    this.#changeCallback = change;
  }

  connectedCallback() {
    if (this.#content) return; // 재부착 시 중복 생성 방지

    this.#toolbar = this.appendChild(document.createElement('div'));
    this.#toolbar.className = 'html-editor-toolbar';
    this.#content = this.appendChild(document.createElement('div'));
    this.#content.className = 'html-editor-content';
    this.#content.contentEditable = 'true';
    this.#content.spellcheck = false;

    // 편집 시 <span style="color"> / <p> 로 출력되도록 (저장 파일 형식과 일치)
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('defaultParagraphSeparator', false, 'p');

    this.#content.addEventListener('input', () => {
      this.#changeCallback();
      this.dispatchEvent(new CustomEvent(HtmlEditor.EVENT_EDITOR_CHANGE));
    });
    this.#content.addEventListener('blur', () => {
      this.#blurCallback();
      this.dispatchEvent(new CustomEvent(HtmlEditor.EVENT_EDITOR_BLUR));
    });
    // 붙여넣기는 plain text 만 (외부 페이지 서식·스타일 유입 차단)
    this.#content.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') ?? '';
      document.execCommand('insertText', false, text);
    });

    this.#buildToolbar();

    this.#loadCallback();
    this.dispatchEvent(new CustomEvent(HtmlEditor.EVENT_EDITOR_LOAD));
  }

  /** 편집 중인 내용을 HTML 문자열로 반환 */
  getEditorHTML(): string {
    return this.#content.innerHTML;
  }

  /**
   * HTML 로 내용을 설정한다.
   * @param html 설정할 HTML
   * @param isAppend true 면 끝에 덧붙임
   */
  setEditorHTML(html: string, isAppend: boolean = false): void {
    if (isAppend) this.#content.insertAdjacentHTML('beforeend', html);
    else this.#content.innerHTML = html;
  }

  hide(): void {
    this.classList.add('hide');
  }

  show(): void {
    this.classList.remove('hide');
  }

  /**
   * execCommand 실행 (포커스 유지). 색은 styleWithCSS 로 <span style="color"> 가 된다.
   */
  #exec(command: string, value?: string): void {
    this.#content.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
  }

  /** 툴바: 글자색 팔레트/커스텀, 굵게, 링크, 서식 지우기 */
  #buildToolbar(): void {
    const button = (label: string, title: string, onClick: () => void, className = '') => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.title = title;
      if (className) btn.className = className;
      btn.addEventListener('mousedown', (ev) => ev.preventDefault()); // 선택 영역·포커스 유지
      btn.addEventListener('click', onClick);
      return this.#toolbar.appendChild(btn);
    };

    for (const color of COLOR_PRESETS) {
      const swatch = button('', `글자색 ${color}`, () => this.#exec('foreColor', color), 'swatch');
      swatch.style.background = color;
    }
    const custom = document.createElement('input');
    custom.type = 'color';
    custom.title = '글자색 직접 지정';
    custom.addEventListener('input', () => this.#exec('foreColor', custom.value));
    this.#toolbar.appendChild(custom);

    button('B', '굵게 (Ctrl+B)', () => this.#exec('bold'), 'bold');
    button('🔗', '링크 (빈 값이면 해제)', () => {
      const url = window.prompt('URL', 'https://');
      if (url === null) return;
      if (url.trim() === '') this.#exec('unlink');
      else this.#exec('createLink', url.trim());
    });
    button('⌫', '서식 지우기 (색·굵게 해제)', () => this.#exec('removeFormat'));
  }
}

customElements.define('html-editor', HtmlEditor);
