import './FlayMemoEditor.scss';

import { EVENT_CHANGE_TITLE } from '../../GroundConstant';
import DateUtils from '../../lib/DateUtils';

export default class FlayMemoEditor extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-memo-editor', 'flay-div');
  }

  async connectedCallback() {
    const { ToastHtmlEditor } = await import(/* webpackChunkName: "ToastHtmlEditor" */ '../../ui/editor/ToastHtmlEditor');
    this.htmlEditor = this.appendChild(new ToastHtmlEditor({ load: async () => await this.load(), blur: async () => await this.save() }));
  }

  async load() {
    const memo = await fetch('/memo').then((res) => res.json());
    this.htmlEditor.setHTML(memo.html);
    this.#successCallback(memo);
  }

  async save() {
    const html = this.htmlEditor.getHTML();
    const memo = await fetch('/memo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html: html, date: 0 }) }).then((res) => res.json());
    this.#successCallback(memo);
  }

  #successCallback(memo) {
    this.dispatchEvent(new CustomEvent(EVENT_CHANGE_TITLE, { detail: { title: `Memo <span style="font-size: var(--size-smallest); font-weight: 400">updated: ${DateUtils.format(memo.date, 'HH:mm:ss')}</span>` } }));
  }
}

customElements.define('flay-memo-editor', FlayMemoEditor, { extends: 'div' });
