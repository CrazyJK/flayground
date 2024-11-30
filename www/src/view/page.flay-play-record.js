import './inc/Page';
import './page.flay-play-record.scss';

import PlayTimeDB from '../flay/idb/PlayTimeDB';
import { toTime } from '../flay/panel/FlayVideoPlayer';
import DateUtils from '../lib/DateUtils';
import FlayFetch from '../lib/FlayFetch';

class Page {
  db;

  constructor() {
    this.db = new PlayTimeDB();
  }

  async start() {
    const LIST = document.querySelector('body > main > ol');
    const records = await this.db.listByLastPlayed();

    const existsResult = await FlayFetch.existsFlayList(...records.map((record) => record.opus));

    for (const recode of records) {
      if (!existsResult[recode.opus]) {
        await this.db.remove(recode.opus);
        console.log('not exists', recode.opus);
        continue;
      }

      LIST.appendChild(document.createElement('li')).innerHTML = `
        <div class="opus">${recode.opus}</div>
        <div class="progress">
          <div class="progress-bar" style="width: ${Math.round((recode.time / recode.duration) * 100)}%"></div>
        </div>
        <div class="time">${toTime(recode.time)}</div>
        <div class="duration">${toTime(recode.duration)}</div>
        <div class="lastPlayed">${DateUtils.format(recode.lastPlayed, 'MM/dd HH:mm')}</div>
      `;
    }

    document.querySelector('.length').innerHTML = ` (${LIST.querySelectorAll('li').length})`;
  }
}

new Page().start();
