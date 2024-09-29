import { toTime } from '../flay/FlayVideoPlayer';
import FlayPlayTimeDB from '../idb/FlayPlayTimeDB';
import DateUtils from '../util/DateUtils';
import './PlayHistory.scss';

export default class PlayHistory extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('play-history');
    const LIST = this.appendChild(document.createElement('ol'));

    this.db = new FlayPlayTimeDB();

    this.db.listByLastPlayed().then((list) => {
      console.log(list);

      list.forEach((recode) => {
        LIST.appendChild(document.createElement('li')).innerHTML = `
          <div class="opus">${recode.opus}</div>
          <div class="progress">
            <div class="progress-bar" style="width: ${Math.round((recode.time / recode.duration) * 100)}%"></div>
          </div>
          <div class="time">${toTime(recode.time)}</div>
          <div class="duration">${toTime(recode.duration)}</div>
          <div class="lastPlayed">${DateUtils.format(recode.lastPlayed, 'MM/dd HH:mm')}</div>
        `;
      });
    });
  }
}

customElements.define('play-history', PlayHistory, { extends: 'div' });
