import FlayAction from '../util/FlayAction';
import { popupActress, popupFlay } from '../util/FlaySearch';
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
  <div id="lowerScoreFlayList">
    <div>
      <label>Lower score Flay</label>
      <button type="button" class="lowerScoreBtn" data-mode="0">list</button>
      <button type="button" class="lowerScoreBtn" data-mode="1">only</button>
    </div>
    <ol>
      <li class="head">
        <label class="studio" >Studio </label>
        <label class="opus"   >Opus   </label>
        <label class="title"  >Title  </label>
        <label class="actress">Actress</label>
        <label class="release">Release</label>
        <label class="like"   >Like   </label>
        <label class="rank"   >Rank   </label>
        <label class="sub"    >Sub.   </label>
        <label class="score"  >Score  </label>
      </li>
    </ol>
  </div>
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

    const ol = this.shadowRoot.querySelector('#lowerScoreFlayList ol');
    this.shadowRoot.querySelectorAll('.lowerScoreBtn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        // orderbyScoreDesc, lowScore
        fetch(`/flay/list/${mode === '0' ? 'orderbyScoreDesc' : 'lowScore'}`)
          .then((res) => res.json())
          .then((list) => {
            ol.querySelectorAll('li:not(.head)').forEach((li) => li.remove());
            list.reverse().forEach((flay) => {
              ol.appendChild(document.createElement('li')).innerHTML = `
                <label class="studio" >${flay.studio}</label>
                <label class="opus"   ><a>${flay.opus}</a></label>
                <label class="title"  >${flay.title}</label>
                <label class="actress">${flay.actressList.map((name) => `<a>${name}</a>`).join(', ')}</label>
                <label class="release">${flay.release}</label>
                <label class="like"   >${flay.video.likes?.length || 0}</label>
                <label class="rank"   >${flay.video.rank}</label>
                <label class="sub"    >${flay.files.subtitles.length}</label>
                <label class="score"  >${flay.score}</label>
              `;
              if (mode === '1') {
                ol.appendChild(document.createElement('li')).innerHTML = `
                  <img src="/static/cover/${flay.opus}" style="width:600px">
                `;
              }
            });
          });
      });
    });
    ol.addEventListener('click', (e) => {
      if (e.target.tagName !== 'A') return;
      if (e.target.closest('label').classList.contains('opus')) {
        const opus = e.target.innerHTML;
        popupFlay(opus);
      } else if (e.target.closest('label').classList.contains('actress')) {
        const name = e.target.innerHTML;
        popupActress(name);
      }
    });

    const batchLog = this.shadowRoot.querySelector('#batchLog');
    window.emitBatch = (data) => {
      const div = batchLog.appendChild(document.createElement('div'));
      div.innerHTML = data.message;
      div.scrollIntoView(true);
    };
  }
}

// Define the new element
customElements.define('flay-batch', FlayBatch);
