import FlayDiv from '@base/FlayDiv';
import FlayCard from '@flay/domain/FlayCard';
import DateUtils from '@lib/DateUtils';
import FlayFetch, { History } from '@lib/FlayFetch';
import './FlayShotDailyPanel.scss';

/**
 * 일별 플레이 기록과 샷(좋아요) 정보를 표시하는 패널 컴포넌트
 *
 * 과거 날짜별로 플레이된 Flay들을 시간 순으로 표시하며,
 * 각 Flay에 샷(좋아요)이 있었는지 시각적으로 구분하여 보여줍니다.
 */
export class FlayShotDailyPanel extends FlayDiv {
  /** 플레이 기록 목록 */
  #playHistoryList: History[] = [];
  /** 현재 표시 중인 이전 일수 */
  #prevDay: number = 0;
  /** 날짜별 opus 매핑 */
  #shotDateOpusMap: Map<string, string[]> = new Map();
  /** 다음 버튼 요소 */
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
    void this.showDaily();
  }

  /** 일별 데이터를 표시합니다. */
  async showDaily(): Promise<void> {
    await this.#fetchPlayHistories();
    await this.#showHistory();
  }

  /** 플레이 기록을 가져와서 날짜별로 정리합니다. */
  async #fetchPlayHistories(): Promise<void> {
    console.time('fetchPlayHistories');
    this.#playHistoryList = await FlayFetch.getHistoryListByAction('PLAY');
    this.#playHistoryList.forEach((history) => {
      const refDate = this.#getRefDate(history.date);
      if (!this.#shotDateOpusMap.has(refDate)) {
        this.#shotDateOpusMap.set(refDate, []);
      }
      const dateOpusList = this.#shotDateOpusMap.get(refDate);
      if (dateOpusList && !dateOpusList.includes(history.opus)) {
        dateOpusList.push(history.opus);
      }
    });
    console.timeEnd('fetchPlayHistories');
    console.debug('shotDateOpusMap', this.#shotDateOpusMap);
  }

  /** 10일씩 기록을 표시합니다. */
  async #showHistory(): Promise<void> {
    const end = this.#prevDay + 10;
    for (; this.#prevDay < end; this.#prevDay++) {
      const date = this.#getDate(this.#prevDay);
      const shotOpusList = this.#shotDateOpusMap.get(date);
      await this.#render(date, shotOpusList);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.appendChild(this.#nextButton);
  }

  /**
   * 오늘에서 n번째 이전 날짜를 구합니다.
   * @param priorDay 오늘에서 n번째 전 날
   * @returns yyyy-mm-dd 형식의 날짜
   */
  #getDate(priorDay: number): string {
    const date = new Date(new Date().setDate(new Date().getDate() - priorDay));
    return date.toISOString().substring(0, 10);
  }

  /**
   * 샷의 기준 날짜를 구합니다.
   * 오전 9시까지를 같은 날짜로 간주합니다.
   * @param date 원본 날짜
   * @returns 기준 날짜 (yyyy-mm-dd)
   */
  #getRefDate(date: string): string {
    const refDate = new Date(date);
    refDate.setHours(refDate.getHours() - 9);
    return refDate.toISOString().substring(0, 10);
  }

  /**
   * 기준 날짜의 Flay들을 화면에 렌더링합니다.
   * @param refDate 기준 날짜
   * @param opusList 품번 배열
   */
  async #render(refDate: string, opusList: string[] = []): Promise<void> {
    console.debug('#render', refDate, opusList);

    const div = this.appendChild(document.createElement('fieldset'));
    div.innerHTML = `
        <legend>${refDate + ' ' + DateUtils.getDayOfWeek(refDate)}</legend>
        <div class="card-list"></div>
      `;
    const cardList = div.querySelector('.card-list');
    if (!cardList) return;

    for (const opus of opusList) {
      const flayCard = new FlayCard({ excludes: ['FlayTag', 'FlayComment', 'FlayFiles'] });
      const fullyFlay = await flayCard.set(opus, undefined);
      const likeCount = fullyFlay?.flay.video.likes?.filter((likeDate) => this.#getRefDate(likeDate) === refDate).length ?? 0;
      flayCard.classList.toggle('shot', likeCount > 0);
      cardList.appendChild(flayCard);
    }
  }
}

/** 커스텀 엘리먼트 등록 */
customElements.define('flay-shot-daily-panel', FlayShotDailyPanel);
