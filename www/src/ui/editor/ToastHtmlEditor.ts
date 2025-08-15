/**
 * ref) toast-ui/editor. https://nhn.github.io/tui.editor/latest/
 */
import { EVENT_EDITOR_BLUR, EVENT_EDITOR_CHANGE, EVENT_EDITOR_LOAD } from '@const/GroundConstant';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Editor from '@toast-ui/editor';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import FlayDiv from '@flay/FlayDiv';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import './ToastHtmlEditor.scss';

interface ToastEditor {
  getHTML(): string;
  setHTML(html: string, isAppend?: boolean): void;
  hide(): void;
  show(): void;
}

export const DEFAULT_CALLBACK = { load: () => {}, blur: () => {}, change: () => {} };

export class ToastHtmlEditor extends FlayDiv {
  #editor!: ToastEditor; // Editor type from @toast-ui/editor
  #loadCallback: () => void;
  #blurCallback: () => void;
  #changeCallback: () => void;

  /**
   *
   * @param {DEFAULT_CALLBACK} callbackFunctions
   */
  constructor(callbackFunctions: Partial<typeof DEFAULT_CALLBACK> = {}) {
    super();

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
      theme: document.querySelector('html')!.getAttribute('theme'),
      hideModeSwitch: true,
      autofocus: false,
      plugins: [colorSyntax],
      events: {
        load: (editor: unknown) => {
          this.#loadCallback();
          this.dispatchEvent(new CustomEvent(EVENT_EDITOR_LOAD, { detail: { editor } }));
        },
        change: (mode: string) => {
          this.#changeCallback();
          this.dispatchEvent(new CustomEvent(EVENT_EDITOR_CHANGE, { detail: { mode } }));
        },
        blur: (mode: string) => {
          this.#blurCallback();
          this.dispatchEvent(new CustomEvent(EVENT_EDITOR_BLUR, { detail: { mode } }));
        },
      },
    }) as ToastEditor;
  }

  getEditorHTML(): string {
    return this.#editor.getHTML();
  }

  setEditorHTML(html: string, isAppend: boolean = false): void {
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
