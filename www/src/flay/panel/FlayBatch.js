import FlayMarker from '@flay/domain/FlayMarker';
import ApiClient from '@lib/ApiClient';
import FlayAction from '@lib/FlayAction';
import FlayFetch from '@lib/FlayFetch';
import { popupActress, popupFlay } from '@lib/FlaySearch';
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
<div class="batch-lower-list" id="lowerScoreFlayList">
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
<div id="lowerScoreFlayChart"></div>
<div class="batch-logs">
  <pre id="batchLog"></pre>
</div>
`;

/**
 *
 */
export default class FlayBatch extends HTMLElement {
  constructor() {
    super();

    this.classList.add('flay-batch', 'flay-div');
    this.innerHTML = HTML;
  }

  connectedCallback() {
    const reload = this.querySelector('#reload');
    reload.addEventListener('click', () => {
      FlayAction.reload(() => {
        FlayFetch.clearAll();
      });
    });
    const lowerScore = this.querySelector('#lowerScore');
    lowerScore.addEventListener('change', (e) => {
      FlayAction.batchSetOption('S');
      if (lowerScore.checked) {
        this.#showLowerScoreFlay();
      }
    });
    FlayAction.batchGetOption('S', (booleanOptionValue) => {
      lowerScore.checked = booleanOptionValue;
      if (lowerScore.checked) {
        this.#showLowerScoreFlay();
      }
    });
    const instanceBatch = this.querySelector('#instanceBatch');
    instanceBatch.addEventListener('click', () => {
      FlayAction.batch('I', () => {
        FlayFetch.clearAll();
      });
    });
    const archiveBatch = this.querySelector('#archiveBatch');
    archiveBatch.addEventListener('click', () => {
      FlayAction.batch('A', () => {
        FlayFetch.clearAll();
      });
    });
    const backup = this.querySelector('#backup');
    backup.addEventListener('click', () => {
      FlayAction.batch('B');
    });

    const batchLog = this.querySelector('#batchLog');
    window.emitBatch = (data) => {
      const div = batchLog.appendChild(document.createElement('div'));
      div.innerHTML = data.message;
      div.scrollIntoView(true);
    };
  }

  #showLowerScoreFlay() {
    const ol = this.querySelector('#lowerScoreFlayList ol');
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
    // orderbyScoreDesc, lowScore
    FlayFetch.getFlayListLowScore().then((list) => {
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
        ol.appendChild(document.createElement('li')).innerHTML = `<img loading="lazy" src="${ApiClient.buildUrl(`/static/cover/${flay.opus}`)}" style="width:600px">`;
      });
    });

    FlayFetch.getFlayListOrderByScoreDesc().then((list) => {
      const scoreMap = new Map();
      list.forEach((flay) => {
        const key = 'S' + flay.score;
        if (!scoreMap.has(key)) {
          scoreMap.set(key, new Array());
        }
        scoreMap.get(key).push(flay);
      });
      console.log('scoreMap', scoreMap);

      const chartWrap = this.querySelector('#lowerScoreFlayChart');
      chartWrap.textContent = null;
      scoreMap.forEach((list, key) => {
        const score = key.substring(1);
        console.log(score, list.length);
      });

      const scoreList = Array.from(scoreMap.keys()).sort((s1, s2) => parseInt(s2.substring(1)) - parseInt(s1.substring(1)));
      console.log('scoreList', scoreList);
      scoreList.forEach((key) => {
        const scoreWrap = chartWrap.appendChild(document.createElement('div'));
        scoreWrap.appendChild(document.createElement('div')).innerHTML = `<label>${key.substring(1)}</label>`;
        scoreWrap.appendChild(document.createElement('div')).append(
          ...scoreMap.get(key).map((flay) => {
            return new FlayMarker(flay, { tooltip: false, shape: 'star' });
          })
        );
      });
    });
  }
}

// Define the new element
customElements.define('flay-batch', FlayBatch);
