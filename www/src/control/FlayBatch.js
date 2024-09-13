import FlayAction from '../util/FlayAction';
import { popupActress, popupFlay } from '../util/FlaySearch';
import './FlayBatch.scss';

const HTML = `
<div class="batch-buttons">
  <button id="reload">Reload</button>
  <span>
    <input type="checkbox" id="lowerScore" />
    <label for="lowerScore">Lower score</label>
  </span>
  <button id="instanceBatch">Instance Batch</button>
  <button id="archiveBatch">Archive Batch</button>
  <button id="backup">Backup</button>
</div>
<div class="batch-logs">
  <pre id="batchLog"></pre>
</div>
<div class="batch-lower-list" id="lowerScoreFlayList">
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
`;

/**
 *
 */
export default class FlayBatch extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('flay-batch');
    this.innerHTML = HTML;
  }

  connectedCallback() {
    const reload = this.querySelector('#reload');
    reload.addEventListener('click', () => {
      FlayAction.reload();
    });
    const lowerScore = this.querySelector('#lowerScore');
    lowerScore.addEventListener('change', (e) => {
      FlayAction.batchSetOption('S');
    });
    FlayAction.batchGetOption('S', (booleanOptionValue) => {
      lowerScore.checked = booleanOptionValue;
    });
    const instanceBatch = this.querySelector('#instanceBatch');
    instanceBatch.addEventListener('click', () => {
      FlayAction.batch('I');
    });
    const archiveBatch = this.querySelector('#archiveBatch');
    archiveBatch.addEventListener('click', () => {
      FlayAction.batch('A');
    });
    const backup = this.querySelector('#backup');
    backup.addEventListener('click', () => {
      FlayAction.batch('B');
    });

    const ol = this.querySelector('#lowerScoreFlayList ol');
    this.querySelectorAll('.lowerScoreBtn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        // orderbyScoreDesc, lowScore
        fetch(`/flay/list/${e.target.dataset.mode === '0' ? 'orderbyScoreDesc' : 'lowScore'}`)
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

    const batchLog = this.querySelector('#batchLog');
    window.emitBatch = (data) => {
      const div = batchLog.appendChild(document.createElement('div'));
      div.innerHTML = data.message;
      div.scrollIntoView(true);
    };
  }
}

// Define the new element
customElements.define('flay-batch', FlayBatch, { extends: 'div' });
