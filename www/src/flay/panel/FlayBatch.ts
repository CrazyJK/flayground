import FlayDiv from '@base/FlayDiv';
import FlayMarker from '@flay/domain/FlayMarker';
import ApiClient from '@lib/ApiClient';
import FlayAction from '@lib/FlayAction';
import FlayFetch, { Flay } from '@lib/FlayFetch';
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
export default class FlayBatch extends FlayDiv {
  constructor() {
    super();

    this.innerHTML = HTML;
  }

  connectedCallback() {
    const reload = this.querySelector('#reload');
    reload?.addEventListener('click', () => {
      void FlayAction.reload(() => {
        FlayFetch.clearAll();
      });
    });
    const lowerScore = this.querySelector('#lowerScore') as HTMLInputElement;
    lowerScore.addEventListener('change', () => {
      void FlayAction.batchSetOption('S');
      if (lowerScore.checked) {
        this.#showLowerScoreFlay();
      }
    });
    void FlayAction.batchGetOption('S', (booleanOptionValue) => {
      lowerScore.checked = Boolean(booleanOptionValue);
      if (lowerScore.checked) {
        this.#showLowerScoreFlay();
      }
    });
    const instanceBatch = this.querySelector('#instanceBatch');
    instanceBatch?.addEventListener('click', () => {
      void FlayAction.batch('I', () => {
        FlayFetch.clearAll();
      });
    });
    const archiveBatch = this.querySelector('#archiveBatch');
    archiveBatch?.addEventListener('click', () => {
      void FlayAction.batch('A', () => {
        FlayFetch.clearAll();
      });
    });
    const backup = this.querySelector('#backup');
    backup?.addEventListener('click', () => {
      void FlayAction.batch('B');
    });

    const batchLog = this.querySelector('#batchLog');
    (window as unknown as { emitBatch?: (data: { message?: string }) => void }).emitBatch = (data: { message?: string }) => {
      if (!batchLog) return;
      const div = batchLog.appendChild(document.createElement('div'));
      div.innerHTML = data.message ?? '';
      div.scrollIntoView(true);
    };
  }

  #showLowerScoreFlay() {
    const ol = this.querySelector('#lowerScoreFlayList ol');
    if (!ol) return;

    ol.addEventListener('click', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      if (target.tagName !== 'A') return;

      const closestLabel = target.closest('label');
      if (!closestLabel) return;

      if (closestLabel.classList.contains('opus')) {
        const opus = target.innerHTML;
        popupFlay(opus);
      } else if (closestLabel.classList.contains('actress')) {
        const name = target.innerHTML;
        popupActress(name);
      }
    });

    // orderbyScoreDesc, lowScore
    void FlayFetch.getFlayListLowScore().then((list) => {
      if (!ol) return;
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

    void FlayFetch.getFlayListOrderByScoreDesc().then((list) => {
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
      if (!chartWrap) return;

      chartWrap.textContent = null;
      scoreMap.forEach((list, key) => {
        const score = key.substring(1);
        console.log(score, list.length);
      });

      const scoreList = Array.from(scoreMap.keys()).sort((s1, s2) => parseInt(s2.substring(1)) - parseInt(s1.substring(1)));
      console.log('scoreList', scoreList);
      scoreList.forEach((key) => {
        if (!chartWrap) return;
        const scoreWrap = chartWrap.appendChild(document.createElement('div'));
        scoreWrap.appendChild(document.createElement('div')).innerHTML = `<label>${key.substring(1)}</label>`;
        scoreWrap.appendChild(document.createElement('div')).append(
          ...scoreMap.get(key).map((flay: Flay) => {
            return new FlayMarker(flay, { tooltip: false, shape: 'star' });
          })
        );
      });
    });
  }
}

// Define the new element
customElements.define('flay-batch', FlayBatch);
