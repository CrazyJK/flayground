import GroundFlay from '@base/GroundFlay';
import { HtmlEditor } from '@editor/HtmlEditor';
import DateUtils from '@lib/common/DateUtils';
import { ModalWindow } from '@lib/components/ModalWindow';
import ApiClient from '@lib/services/ApiClient';
import FlayStorage from '@lib/storage/FlayStorage';
import './FlayMemoEditor.scss';

const MEMO_STORAGE_KEY = 'flay-memo';

interface Memo {
  html: string;
  lastModified: string;
}

/**
 * Memo editor
 * @extends {HTMLDivElement}
 */
export class FlayMemoEditor extends GroundFlay {
  private htmlEditor: HtmlEditor;

  constructor() {
    super();

    onstorage = async (e) => {
      // Load memo when memo storage key is changed
      if (e.key === MEMO_STORAGE_KEY) {
        await this.load();
      }
    };
    this.htmlEditor = this.appendChild(new HtmlEditor({ load: async () => await this.load(), blur: async () => await this.save() }));
  }

  /**
   * Load memo
   */
  async load() {
    const memo: Memo = (await ApiClient.get('/memos'))!;
    this.htmlEditor.setEditorHTML(memo.html);
    this.#successCallback(memo);
  }

  /**
   * Save memo
   */
  async save() {
    // 백엔드는 express.json 으로 받으므로 JSON 본문으로 전송
    const memo: Memo = (await ApiClient.post('/memos', { html: this.htmlEditor.getEditorHTML() }))!;
    FlayStorage.local.set(MEMO_STORAGE_KEY, memo.lastModified); // Save memo last modified date
    this.#successCallback(memo);
  }

  /**
   * Success callback. Dispatch event to change title.
   * @param memo
   */
  #successCallback(memo: Memo) {
    console.log('Memo saved/loaded successfully:', memo);
    this.dispatchEvent(new CustomEvent(ModalWindow.EVENT_CHANGE_TITLE, { detail: { title: `Memo <span style="font-size: var(--size-smallest); font-weight: 400">updated: ${DateUtils.format(memo.lastModified, 'M/d HH:mm')} ${memo.html.length} characters</span>` } }));
  }
}

customElements.define('flay-memo-editor', FlayMemoEditor);
