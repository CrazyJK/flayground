import flayAction from '../../util/flay.action';

/**
 *
 */
export default class FlayBatch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    const wrapper = document.createElement('div');
    wrapper.classList.add('flay-batch');
    this.shadowRoot.append(LINK, STYLE, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    wrapper.innerHTML = HTML;

    const reload = this.shadowRoot.querySelector('#reload');
    reload.addEventListener('click', () => {
      flayAction.reload();
    });
    const lowerScore = this.shadowRoot.querySelector('#lowerScore');
    lowerScore.addEventListener('change', (e) => {
      flayAction.batchSetOption('S');
    });
    flayAction.batchGetOption('S', (booleanOptionValue) => {
      lowerScore.checked = booleanOptionValue;
    });
    const instanceBatch = this.shadowRoot.querySelector('#instanceBatch');
    instanceBatch.addEventListener('click', () => {
      flayAction.batch('I');
    });
    const archiveBatch = this.shadowRoot.querySelector('#archiveBatch');
    archiveBatch.addEventListener('click', () => {
      flayAction.batch('A');
    });
    const backup = this.shadowRoot.querySelector('#backup');
    backup.addEventListener('click', () => {
      flayAction.batch('B');
    });
    const batchLog = this.shadowRoot.querySelector('#batchLog');

    window.emitBatch = (data) => {
      batchLog.innerHTML += data.message + '\n';
    };
  }
}

// Define the new element
customElements.define('flay-batch', FlayBatch);

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

const CSS = `
div.flay-batch {
  padding: 2rem;
  border-radius: 0.25rem;
}
div.flay-batch > div {
  display: flex;
  gap: 1rem;
}

span,
button {
  border: 1px solid var(--color-border);
  padding: 0.5rem;
  border-radius: 0.25rem;
  box-shadow: var(--box-shadow);
}

div.flay-batch pre {
  font-family: D2Coding;
  font-size: 14px;
  text-align: left;
  flex: 1 1 auto;
  margin: 1rem;
  border: 1px solid var(--color-border);
  padding: 1rem;
  background-color: #111;
  color: #eee;
  width: 100%;
  overflow: auto;
}
`;
