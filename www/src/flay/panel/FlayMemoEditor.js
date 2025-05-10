import { EVENT_CHANGE_TITLE } from '@/GroundConstant';
import ApiClient from '@lib/ApiClient';
import DateUtils from '@lib/DateUtils';
import FileUtils from '@lib/FileUtils';
import FlayStorage from '@lib/FlayStorage';
import './FlayMemoEditor.scss';

const MEMO_STORAGE_KEY = 'flay-memo';

/**
 * Memo editor
 * @extends {HTMLDivElement}
 */
export class FlayMemoEditor extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('flay-memo-editor', 'flay-div');

    onstorage = async (e) => {
      // Load memo when memo storage key is changed
      if (e.key === MEMO_STORAGE_KEY) {
        await this.load();
      }
    };
  }

  async connectedCallback() {
    const { ToastHtmlEditor } = await import(/* webpackChunkName: "ToastHtmlEditor" */ '../../ui/editor/ToastHtmlEditor'); // ToastHtmlEditor import
    this.htmlEditor = this.appendChild(new ToastHtmlEditor({ load: async () => await this.load(), blur: async () => await this.save() })); // ToastHtmlEditor instance
  }

  /**
   * Load memo
   */
  async load() {
    const memo = await ApiClient.get('/memo');
    this.htmlEditor.setHTML(memo.html);
    this.#successCallback(memo);
  }

  /**
   * Save memo
   */
  async save() {
    const formData = new FormData();
    formData.set('html', this.htmlEditor.getHTML());
    const memo = await ApiClient.post('/memo', formData);
    FlayStorage.local.set(MEMO_STORAGE_KEY, memo.date); // Save memo date
    this.#successCallback(memo);
  }

  /**
   * Success callback. Dispatch event to change title.
   * @param {object} memo
   */
  #successCallback(memo) {
    this.dispatchEvent(new CustomEvent(EVENT_CHANGE_TITLE, { detail: { title: `Memo <span style="font-size: var(--size-smallest); font-weight: 400">updated: ${DateUtils.format(memo.date, 'M/d HH:mm')} ${FileUtils.prettySize(memo.size).join('')}</span>` } }));
  }
}

customElements.define('flay-memo-editor', FlayMemoEditor, { extends: 'div' });
