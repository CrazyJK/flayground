import './FlayEditor.scss';

import Editor from '@toast-ui/editor';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';

export const EVENT_LOAD = 'editor-load';
export const EVENT_BLUR = 'editor-blur';
export const EVENT_CHANGE = 'editor-change';

export class FlayHtmlEditor extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-html-editor', 'flay-div');
  }

  async connectedCallback() {
    this.editor = new Editor({
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
          console.debug('FlayEditor load', editor);
          this.dispatchEvent(new Event(EVENT_LOAD));
        },
        change: (mode) => {
          console.debug('FlayEditor change', mode);
          this.dispatchEvent(new Event(EVENT_CHANGE));
        },
        blur: (mode) => {
          console.debug('FlayEditor blur', mode);
          this.dispatchEvent(new Event(EVENT_BLUR));
        },
      },
    });
  }

  getHTML() {
    return this.editor.getHTML();
  }

  setHTML(html) {
    this.editor.setHTML(html, false);
  }

  hide() {
    this.editor.hide();
  }

  show() {
    this.editor.show();
  }
}

customElements.define('flay-html-editor', FlayHtmlEditor, { extends: 'div' });

export class FlayHtmlViewer extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-html-viewer', 'flay-div');
  }

  async connectedCallback() {
    this.viewer = Editor.factory({
      el: this,
      viewer: true,
      height: '100%',
      theme: document.querySelector('html').getAttribute('theme'),
      // initialValue: diaryEditor.getHTML(),
    });
  }

  setHTML(html) {
    console.log(this.viewer);
    this.viewer.preview.setHTML(html);
  }
}

customElements.define('flay-html-viewer', FlayHtmlViewer, { extends: 'div' });
