/**
 * ref) toast-ui/editor. https://nhn.github.io/tui.editor/latest/
 */
import { EVENT_EDITOR_BLUR, EVENT_EDITOR_CHANGE, EVENT_EDITOR_LOAD } from '@/GroundConstant';
import Editor from '@toast-ui/editor';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import './ToastHtmlEditor.scss';

const DEFAULT_CALLBACK = { load: () => {}, blur: () => {}, change: () => {} };

export class ToastHtmlEditor extends HTMLDivElement {
  #editor;
  #loadCallback;
  #blurCallback;
  #changeCallback;

  /**
   *
   * @param {DEFAULT_CALLBACK} callbackFunctions
   */
  constructor(callbackFunctions) {
    super();
    this.classList.add('toast-html-editor', 'flay-div');

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
        load: (editor) => {
          this.#loadCallback();
          this.dispatchEvent(new Event(EVENT_EDITOR_LOAD));
        },
        change: (mode) => {
          this.#changeCallback();
          this.dispatchEvent(new Event(EVENT_EDITOR_CHANGE));
        },
        blur: (mode) => {
          this.#blurCallback();
          this.dispatchEvent(new Event(EVENT_EDITOR_BLUR));
        },
      },
    });
  }

  getHTML() {
    return this.#editor.getHTML();
  }

  setHTML(html) {
    this.#editor.setHTML(html, false);
  }

  hide() {
    this.#editor.hide();
    this.classList.add('hide');
  }

  show() {
    this.#editor.show();
    this.classList.remove('hide');
  }
}

customElements.define('toast-html-editor', ToastHtmlEditor, { extends: 'div' });
