import FlayAction from '../util/FlayAction';
import './FlayBatch.scss';

const HTML = `
<div>
  <button id="reload">Reload</button>
  <span>
    <input type="checkbox" id="lowerScore" />
    <label for="lowerScore">Lower score</label>
  </span>
  <button id="instanceBatch">Instance Batch</button>
  <button id="archiveBatch">Archive Batch</button>
  <button id="backup">Backup</button>
</div>
<div>
  <pre id="batchLog"></pre>
</div>
`;

/**
 *
 */
export default class FlayBatch extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = HTML;
  }

  connectedCallback() {
    const reload = this.shadowRoot.querySelector('#reload');
    reload.addEventListener('click', () => {
      FlayAction.reload();
    });
    const lowerScore = this.shadowRoot.querySelector('#lowerScore');
    lowerScore.addEventListener('change', (e) => {
      FlayAction.batchSetOption('S');
    });
    FlayAction.batchGetOption('S', (booleanOptionValue) => {
      lowerScore.checked = booleanOptionValue;
    });
    const instanceBatch = this.shadowRoot.querySelector('#instanceBatch');
    instanceBatch.addEventListener('click', () => {
      FlayAction.batch('I');
    });
    const archiveBatch = this.shadowRoot.querySelector('#archiveBatch');
    archiveBatch.addEventListener('click', () => {
      FlayAction.batch('A');
    });
    const backup = this.shadowRoot.querySelector('#backup');
    backup.addEventListener('click', () => {
      FlayAction.batch('B');
    });
    const batchLog = this.shadowRoot.querySelector('#batchLog');

    window.emitBatch = (data) => {
      batchLog.innerHTML += data.message + '\n';
    };
  }
}

// Define the new element
customElements.define('flay-batch', FlayBatch);
