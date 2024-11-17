import { toTime } from './flay/FlayVideoPlayer';
import PlayTimeDB from './idb/PlayTimeDB';
import './init/Page';
import './page.flay-play-history.scss';
import DateUtils from './util/DateUtils';

class Page {
  db;

  constructor() {
    this.db = new PlayTimeDB();
  }

  async start() {
    const list = await this.db.listByLastPlayed();
    console.log(list);

    const LIST = document.querySelector('body > main > ol');
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
  }
}

new Page().start();
