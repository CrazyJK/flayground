import './init/Page';
import './page.shot-history.scss';

import FlayCard from './flay/FlayCard';
import { getDayOfWeek } from './util/dateUtils';

class Page {
  prevDay;
  shotDateOpusMap;

  constructor() {
    this.prevDay = 0;
    this.shotDateOpusMap = new Map();
  }

  async #fetchPlayHistories() {
    console.time('fetchPlayHistories');
    const playHistoryList = await fetch('/info/history/find/action/PLAY').then((res) => res.json());
    Array.from(playHistoryList).forEach((history) => {
      const refDate = this.#getRefDate(history.date);
      if (!this.shotDateOpusMap.has(refDate)) {
        this.shotDateOpusMap.set(refDate, []);
      }
      if (!this.shotDateOpusMap.get(refDate).includes(history.opus)) {
        this.shotDateOpusMap.get(refDate).push(history.opus);
      }
    });
    console.timeEnd('fetchPlayHistories');
  }

  async #showHistory() {
    let end = this.prevDay + 10;

    for (; this.prevDay < end; this.prevDay++) {
      const date = this.#getDate(this.prevDay);
      const shotOpusList = this.shotDateOpusMap.get(date);

      await this.#render(date, shotOpusList);

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   *
   * @param {number} priorDay 오늘에서 n번째 전 날
   * @returns yyyy-mm-dd 날짜
   */
  #getDate(priorDay) {
    const date = new Date(new Date().setDate(new Date().getDate() - priorDay));
    return date.toISOString().substring(0, 10);
  }

  /**
   * shot의 기준 날짜 구하기.
   * - 오전 9시까지를 같은 날짜로 본다
   * @param {string} date
   * @returns
   */
  #getRefDate(date) {
    const refDate = new Date(date);
    refDate.setHours(refDate.getHours() - 9);
    return refDate.toISOString().substring(0, 10);
  }

  /**
   * 기준 날짜의 flay 표시
   * @param {string} refDate 기준 날자
   * @param {string[]} opusList 품번 배열
   */
  async #render(refDate, opusList = []) {
    console.debug('#render', refDate, opusList);

    const MAIN = document.querySelector('body > main');
    const div = MAIN.appendChild(document.createElement('fieldset'));
    div.innerHTML = `
      <legend>${refDate + ' ' + getDayOfWeek(refDate)}</legend>
      <div class="card-list"></div>
    `;
    const cardList = div.querySelector('.card-list');
    for (let opus of opusList) {
      const flayCard = cardList.appendChild(new FlayCard({ excludes: ['FlayTag', 'FlayComment', 'FlayFiles'] }));
      const fullyFlay = await flayCard.set(opus);
      flayCard.classList.toggle('shot', fullyFlay.flay.video.likes?.filter((likeDate) => this.#getRefDate(likeDate) === refDate).length > 0);
    }
  }

  async start() {
    await this.#fetchPlayHistories();
    await this.#showHistory();

    document.getElementById('next').addEventListener('click', () => this.#showHistory());
  }
}

new Page().start();
