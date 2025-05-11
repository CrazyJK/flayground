import Editor from '@toast-ui/editor';
import './ToastHtmlViewer.scss';

export class ToastHtmlViewer extends HTMLDivElement {
  #viewer;
  #htmlContent;

  constructor(htmlContent = '') {
    super();
    this.classList.add('toast-html-viewer', 'flay-div');
    this.#htmlContent = htmlContent;
  }

  connectedCallback() {
    this.#viewer = Editor.factory({
      el: this,
      viewer: true,
      height: '100%',
      theme: document.querySelector('html').getAttribute('theme'),
      initialValue: this.#htmlContent,
    });
  }

  setHTML(html) {
    this.#viewer.preview.setHTML(html);
  }
}

customElements.define('toast-html-viewer', ToastHtmlViewer, { extends: 'div' });
