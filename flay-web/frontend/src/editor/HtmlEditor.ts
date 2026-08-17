/**
 * TipTap(ProseMirror) 기반 WYSIWYG HTML 에디터 커스텀 엘리먼트.
 * ref) https://tiptap.dev/docs/editor
 *
 * 공개 API·이벤트 이름:
 *   getEditorHTML() / setEditorHTML(html, append) / hide() / show()
 *   이벤트 editor-load · editor-change · editor-blur (+ 생성자 콜백 { load, blur, change })
 */
import GroundEditor from '@base/GroundEditor';
import { Editor } from '@tiptap/core';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import './HtmlEditor.scss';

export const DEFAULT_CALLBACK = { load: () => {}, blur: () => {}, change: () => {} };

/** 글자색 팔레트 (프리셋). 마지막 항목은 커스텀 색 입력 */
const COLOR_PRESETS = ['#f85149', '#f7ca88', '#3fb950', '#58a6ff', '#bc8cff', '#f778ba'];

/** 툴바 버튼 정의: [라벨, 툴팁, 실행, 활성 판정 이름] */
type ToolbarItem = { label: string; title: string; run: (editor: Editor) => void; active?: string | ((editor: Editor) => boolean) };

const TOOLBAR: ToolbarItem[] = [
  { label: 'B', title: '굵게 (Ctrl+B)', run: (e) => e.chain().focus().toggleBold().run(), active: 'bold' },
  { label: 'I', title: '기울임 (Ctrl+I)', run: (e) => e.chain().focus().toggleItalic().run(), active: 'italic' },
  { label: 'U', title: '밑줄 (Ctrl+U)', run: (e) => e.chain().focus().toggleUnderline().run(), active: 'underline' },
  { label: 'S', title: '취소선 (Ctrl+Shift+S)', run: (e) => e.chain().focus().toggleStrike().run(), active: 'strike' },
  { label: '•', title: '글머리 목록', run: (e) => e.chain().focus().toggleBulletList().run(), active: 'bulletList' },
  { label: '1.', title: '번호 목록', run: (e) => e.chain().focus().toggleOrderedList().run(), active: 'orderedList' },
  {
    label: '🔗',
    title: '링크',
    run: (e) => {
      const prev = e.getAttributes('link').href as string | undefined;
      const url = window.prompt('URL', prev ?? 'https://');
      if (url === null) return;
      if (url.trim() === '') e.chain().focus().extendMarkRange('link').unsetLink().run();
      else e.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    },
    active: 'link',
  },
  { label: '⌫', title: '서식 지우기', run: (e) => e.chain().focus().unsetAllMarks().clearNodes().run() },
];

export class HtmlEditor extends GroundEditor {
  /** 에디터 로드 이벤트 */
  static readonly EVENT_EDITOR_LOAD = 'editor-load';
  /** 에디터를 벗어나는 이벤트 */
  static readonly EVENT_EDITOR_BLUR = 'editor-blur';
  /** 에디터 내용이 변경되는 이벤트 */
  static readonly EVENT_EDITOR_CHANGE = 'editor-change';

  #editor!: Editor;
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
    if (this.#editor) return; // 재부착 시 중복 생성 방지

    this.#toolbar = this.appendChild(document.createElement('div'));
    this.#toolbar.className = 'html-editor-toolbar';
    this.#content = this.appendChild(document.createElement('div'));
    this.#content.className = 'html-editor-content';

    this.#editor = new Editor({
      element: this.#content,
      extensions: [StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false, link: { openOnClick: false, autolink: false } }), TextStyle, Color],
      content: '',
      autofocus: false,
      editorProps: { attributes: { class: 'html-editor-prosemirror', spellcheck: 'false' } },
      onCreate: () => {
        this.#loadCallback();
        this.dispatchEvent(new CustomEvent(HtmlEditor.EVENT_EDITOR_LOAD, { detail: { editor: this.#editor } }));
      },
      onUpdate: () => {
        this.#changeCallback();
        this.dispatchEvent(new CustomEvent(HtmlEditor.EVENT_EDITOR_CHANGE));
      },
      onBlur: () => {
        this.#blurCallback();
        this.dispatchEvent(new CustomEvent(HtmlEditor.EVENT_EDITOR_BLUR));
      },
      onSelectionUpdate: () => this.#refreshToolbar(),
      onTransaction: () => this.#refreshToolbar(),
    });

    this.#buildToolbar();
  }

  disconnectedCallback() {
    this.#editor?.destroy();
  }

  /** 편집 중인 내용을 HTML 문자열로 반환 */
  getEditorHTML(): string {
    return this.#editor.getHTML();
  }

  /**
   * HTML 로 내용을 설정한다.
   * @param html 설정할 HTML
   * @param isAppend true 면 끝에 덧붙임
   */
  setEditorHTML(html: string, isAppend: boolean = false): void {
    if (isAppend) {
      this.#editor.chain().insertContentAt(this.#editor.state.doc.content.size, html).run();
    } else {
      this.#editor.commands.setContent(html, { emitUpdate: false });
    }
  }

  hide(): void {
    this.classList.add('hide');
  }

  show(): void {
    this.classList.remove('hide');
  }

  /** 툴바 버튼과 색상 팔레트 생성 */
  #buildToolbar(): void {
    for (const item of TOOLBAR) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = item.label;
      btn.title = item.title;
      btn.dataset.active = typeof item.active === 'string' ? item.active : '';
      // mousedown 에서 포커스 이동을 막아 선택 영역을 유지
      btn.addEventListener('mousedown', (ev) => ev.preventDefault());
      btn.addEventListener('click', () => item.run(this.#editor));
      this.#toolbar.appendChild(btn);
    }

    const palette = this.#toolbar.appendChild(document.createElement('span'));
    palette.className = 'html-editor-palette';
    for (const color of COLOR_PRESETS) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'swatch';
      swatch.style.background = color;
      swatch.title = `글자색 ${color}`;
      swatch.addEventListener('mousedown', (ev) => ev.preventDefault());
      swatch.addEventListener('click', () => this.#editor.chain().focus().setColor(color).run());
      palette.appendChild(swatch);
    }
    const custom = document.createElement('input');
    custom.type = 'color';
    custom.title = '글자색 직접 지정';
    custom.addEventListener('input', () => this.#editor.chain().focus().setColor(custom.value).run());
    palette.appendChild(custom);
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'swatch reset';
    reset.title = '글자색 해제';
    reset.textContent = '×';
    reset.addEventListener('mousedown', (ev) => ev.preventDefault());
    reset.addEventListener('click', () => this.#editor.chain().focus().unsetColor().run());
    palette.appendChild(reset);
  }

  /** 현재 선택 영역의 서식에 맞춰 버튼 활성 표시 갱신 */
  #refreshToolbar(): void {
    if (!this.#toolbar) return;
    this.#toolbar.querySelectorAll<HTMLButtonElement>('button[data-active]').forEach((btn) => {
      const name = btn.dataset.active;
      btn.classList.toggle('active', !!name && this.#editor.isActive(name));
    });
  }
}

customElements.define('html-editor', HtmlEditor);
