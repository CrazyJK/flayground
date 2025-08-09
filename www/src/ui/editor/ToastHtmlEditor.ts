/**
 * ref) toast-ui/editor. https://nhn.github.io/tui.editor/latest/
 */
import { EVENT_EDITOR_BLUR, EVENT_EDITOR_CHANGE, EVENT_EDITOR_LOAD } from '@/GroundConstant';
import Editor, { EditorType } from '@toast-ui/editor';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import './ToastHtmlEditor.scss';

export const DEFAULT_CALLBACK = { load: () => {}, blur: () => {}, change: () => {} };

export class ToastHtmlEditor extends HTMLElement {
  #editor: Editor;
  #loadCallback: () => void;
  #blurCallback: () => void;
  #changeCallback: () => void;

  /**
   *
   * @param {DEFAULT_CALLBACK} callbackFunctions
   */
  constructor(callbackFunctions: Partial<typeof DEFAULT_CALLBACK> = {}) {
    super();
    this.classList.add('flay-div');

    const { load, blur, change } = { ...DEFAULT_CALLBACK, ...callbackFunctions };
    this.#loadCallback = load;
    this.#blurCallback = blur;
    this.#changeCallback = change;
  }

  connectedCallback() {
    this.#editor = new Editor({
      el: this,
      height: '100%',
      minHeight: '300px',
      initialEditType: 'wysiwyg',
      previewStyle: 'vertical',
      theme: document.querySelector('html').getAttribute('theme'),
      hideModeSwitch: true,
      autofocus: false,
      plugins: [colorSyntax],
      events: {
        load: (editor: Editor) => {
          this.#loadCallback();
          this.dispatchEvent(new CustomEvent(EVENT_EDITOR_LOAD, { detail: { editor } }));
        },
        change: (mode: EditorType) => {
          this.#changeCallback();
          this.dispatchEvent(new CustomEvent(EVENT_EDITOR_CHANGE, { detail: { mode } }));
        },
        blur: (mode: EditorType) => {
          this.#blurCallback();
          this.dispatchEvent(new CustomEvent(EVENT_EDITOR_BLUR, { detail: { mode } }));
        },
      },
    });
  }

  getHTML(): string {
    return this.#editor.getHTML();
  }

  setHTML(html: string, isAppend: boolean = false): void {
    this.#editor.setHTML(html, isAppend);
  }

  hide(): void {
    this.#editor.hide();
    this.classList.add('hide');
  }

  show(): void {
    this.#editor.show();
    this.classList.remove('hide');
  }
}

customElements.define('toast-html-editor', ToastHtmlEditor);
