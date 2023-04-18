import flayAction from '../../util/flay.action';

/**
 *
 */
export default class FlayBatch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const wrapper = document.createElement('div');
    wrapper.classList.add('flay-batch');
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', './css/components.css');
    const link2 = document.createElement('link');
    link2.setAttribute('rel', 'stylesheet');
    link2.setAttribute('href', './css/FlayBatch.css');
    this.shadowRoot.append(link, link2, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

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
