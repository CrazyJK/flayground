import { EVENT_CHANGE_TITLE } from '@const/GroundConstant';
import ApiClient from '@lib/ApiClient';
import DateUtils from '@lib/DateUtils';
import FileUtils from '@lib/FileUtils';
import FlayStorage from '@lib/FlayStorage';
import { ToastHtmlEditor } from '@ui/editor/ToastHtmlEditor';
import './FlayMemoEditor.scss';

const MEMO_STORAGE_KEY = 'flay-memo';

/**
 * Memo editor
 * @extends {HTMLDivElement}
 */
export class FlayMemoEditor extends HTMLElement {
  private htmlEditor: ToastHtmlEditor;

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
    this.htmlEditor = this.appendChild(new ToastHtmlEditor({ load: async () => await this.load(), blur: async () => await this.save() })); // ToastHtmlEditor instance
  }

  /**
   * Load memo
   */
  async load() {
    const memo = (await ApiClient.get('/memo')) as { html: string };
    this.htmlEditor.setHTML(memo.html);
    this.#successCallback(memo);
  }

  /**
   * Save memo
   */
  async save() {
    const formData = new FormData();
    formData.set('html', this.htmlEditor.getHTML());
    const memo = (await ApiClient.post('/memo', formData)) as { html: string; date: string; size: number };
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

customElements.define('flay-memo-editor', FlayMemoEditor);
