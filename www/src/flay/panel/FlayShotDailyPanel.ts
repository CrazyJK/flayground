import FlayCard from '@flay/domain/FlayCard';
import FlayFetch, { History } from '@lib/FlayFetch';
import DateUtils from '@lib/DateUtils';
import './FlayShotDailyPanel.scss';

export class FlayShotDailyPanel extends HTMLDivElement {
  #playHistoryList: History[];
  #prevDay: number = 0;
  #shotDateOpusMap: Map<string, string[]> = new Map();
  #nextButton: HTMLButtonElement;

  constructor() {
    super();
    this.classList.add('flay-shot-daily-panel');
    this.#nextButton = document.createElement('button');
    this.#nextButton.id = 'next';
    this.#nextButton.textContent = 'Next';
    this.#nextButton.addEventListener('click', () => this.#showHistory());
    this.appendChild(this.#nextButton);
  }

  connectedCallback() {
    this.showDaily();
  }

  async showDaily(): Promise<void> {
    await this.#fetchPlayHistories();
    await this.#showHistory();
  }

  async #fetchPlayHistories(): Promise<void> {
    console.time('fetchPlayHistories');
    this.#playHistoryList = await FlayFetch.getHistoryListByAction('PLAY');
    this.#playHistoryList.forEach((history) => {
      const refDate = this.#getRefDate(history.date);
      if (!this.#shotDateOpusMap.has(refDate)) {
        this.#shotDateOpusMap.set(refDate, []);
      }
      if (!this.#shotDateOpusMap.get(refDate).includes(history.opus)) {
        this.#shotDateOpusMap.get(refDate).push(history.opus);
      }
    });
    console.timeEnd('fetchPlayHistories');
    console.debug('shotDateOpusMap', this.#shotDateOpusMap);
  }

  async #showHistory(): Promise<void> {
    let end = this.#prevDay + 10;
    for (; this.#prevDay < end; this.#prevDay++) {
      const date = this.#getDate(this.#prevDay);
      const shotOpusList = this.#shotDateOpusMap.get(date);
      await this.#render(date, shotOpusList);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.appendChild(this.#nextButton);
  }

  /**
   *
   * @param {number} priorDay 오늘에서 n번째 전 날
   * @returns yyyy-mm-dd 날짜
   */
  #getDate(priorDay: number): string {
    const date = new Date(new Date().setDate(new Date().getDate() - priorDay));
    return date.toISOString().substring(0, 10);
  }

  /**
   * shot의 기준 날짜 구하기.
   * - 오전 9시까지를 같은 날짜로 본다
   * @param {string} date
   * @returns
   */
  #getRefDate(date: string): string {
    const refDate = new Date(date);
    refDate.setHours(refDate.getHours() - 9);
    return refDate.toISOString().substring(0, 10);
  }

  /**
   * 기준 날짜의 flay 표시
   * @param {string} refDate 기준 날자
   * @param {string[]} opusList 품번 배열
   */
  async #render(refDate: string, opusList: string[] = []): Promise<void> {
    console.debug('#render', refDate, opusList);

    const div = this.appendChild(document.createElement('fieldset'));
    div.innerHTML = `
        <legend>${refDate + ' ' + DateUtils.getDayOfWeek(refDate)}</legend>
        <div class="card-list"></div>
      `;
    const cardList = div.querySelector('.card-list');
    for (const opus of opusList) {
      const flayCard = new FlayCard({ excludes: ['FlayTag', 'FlayComment', 'FlayFiles'] });
      const fullyFlay = await flayCard.set(opus, null);
      flayCard.classList.toggle('shot', fullyFlay?.flay.video.likes?.filter((likeDate) => this.#getRefDate(likeDate) === refDate).length > 0);
      cardList.appendChild(flayCard);
    }
  }
}

customElements.define('flay-shot-daily-panel', FlayShotDailyPanel, { extends: 'div' });
