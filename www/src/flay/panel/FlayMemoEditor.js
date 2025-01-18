import './FlayMemoEditor.scss';

import DateUtils from '../../lib/DateUtils';

export default class FlayMemoEditor extends HTMLDivElement {
  lastUpdated;

  constructor() {
    super();

    this.classList.add('flay-memo-editor', 'flay-div');
  }

  async connectedCallback() {
    const { FlayHtmlEditor, EVENT_LOAD, EVENT_BLUR } = await import(/* webpackChunkName: "FlayEditor" */ './FlayEditor');
    this.htmlEditor = new FlayHtmlEditor();
    this.htmlEditor.addEventListener(EVENT_LOAD, async () => await this.load());
    this.htmlEditor.addEventListener(EVENT_BLUR, async () => await this.save());

    this.append(this.htmlEditor);
  }

  async load() {
    const memo = await fetch('/memo').then((res) => res.json());
    this.htmlEditor.setHTML(memo.html);
    this.#successCallback(memo);
  }

  async save() {
    const html = this.htmlEditor.getHTML();
    const retMemo = await fetch('/memo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html: html, date: 0 }) }).then((res) => res.json());
    this.#successCallback(retMemo);
  }

  #successCallback(memo) {
    console.log('successCallback', DateUtils.format(memo.date));
    this.lastUpdated = memo.date;
  }
}

customElements.define('flay-memo-editor', FlayMemoEditor, { extends: 'div' });
