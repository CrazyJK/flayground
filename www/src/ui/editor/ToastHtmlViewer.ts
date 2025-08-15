import FlayDiv from '@flay/FlayDiv';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Editor from '@toast-ui/editor';
import './ToastHtmlViewer.scss';

interface ToastViewer {
  preview: {
    setHTML(html: string): void;
  };
}

export class ToastHtmlViewer extends FlayDiv {
  #viewer!: ToastViewer;
  #htmlContent: string;

  constructor(htmlContent = '') {
    super();
    this.#htmlContent = htmlContent;
  }

  connectedCallback() {
    this.#viewer = Editor.factory({
      el: this,
      viewer: true,
      height: '100%',
      theme: document.querySelector('html')!.getAttribute('theme'),
      initialValue: this.#htmlContent,
    }) as ToastViewer;
  }

  setHTML(html: string): void {
    this.#viewer.preview.setHTML(html);
  }
}

customElements.define('toast-html-viewer', ToastHtmlViewer);
