import DateUtils from '@lib/DateUtils';
import FlayFetch from '@lib/FlayFetch';
import './inc/Page';
import './page.history-play.scss';

class Page {
  constructor() {}

  async start() {
    // 데이터 가져오기
    const playHistories = await FlayFetch.getHistoryListByAction('PLAY');

    // 데이터 처리 - Map 대신 객체 사용을 고려하여 성능 개선
    const dateMap = this.#processHistoryData(playHistories);

    // 날짜 범위 계산
    const dates = Object.keys(dateMap).sort();
    const [minYear, maxYear] = [Number(dates[0].substring(0, 4)), Number(dates[dates.length - 1].substring(0, 4))];

    // DOM 생성 최적화 - DocumentFragment 사용
    const fragment = document.createDocumentFragment();
    const dateBarMap = {};

    // 년도별 렌더링 (최신 년도부터)
    for (let year = maxYear; year >= minYear; year--) {
      const yearArticle = document.createElement('article');
      yearArticle.id = 'y' + year;

      // 날짜 생성 최적화 - 배열로 미리 날짜 계산
      const daysInYear = this.#getDaysInYear(year);

      // 일자별 바 요소 생성 - 한번에 처리
      for (const dateStr of daysInYear) {
        const dayBar = document.createElement('div');
        dayBar.id = 'd' + dateStr;
        dayBar.innerHTML = '&nbsp;';
        yearArticle.appendChild(dayBar);
        dateBarMap[dateStr] = dayBar; // 참조 캐싱
      }

      fragment.appendChild(yearArticle);

      // 연도 레전드 추가
      const legend = document.createElement('h2');
      legend.className = 'legend';
      legend.textContent = String(year); // innerHTML 대신 textContent 사용
      fragment.appendChild(legend);
    }

    // 한 번에 DOM에 추가
    const main = document.querySelector('body > main');
    main.appendChild(fragment);

    // 데이터 적용 - 미리 캐싱된 DOM 참조 사용
    this.#applyDataToDayBars(dateMap, dateBarMap);
  }

  // 새로운 메소드: 히스토리 데이터 처리를 최적화
  #processHistoryData(playHistories) {
    const dateMap = {};

    for (const history of playHistories) {
      const date = this.#getRefDate(history.date);
      const opus = history.opus;

      if (!dateMap[date]) {
        dateMap[date] = [];
      }

      if (!dateMap[date].includes(opus)) {
        dateMap[date].push(opus);
      }
    }

    return dateMap;
  }

  // 새로운 메소드: 연도의 모든 날짜를 문자열 형식으로 미리 계산
  #getDaysInYear(year) {
    const result = [];
    const isLeapYear = new Date(year, 1, 29).getMonth() === 1; // 윤년 체크
    const daysCount = isLeapYear ? 366 : 365;

    const baseDate = new Date(year, 0, 1); // 1월 1일

    for (let d = 0; d < daysCount; d++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(baseDate.getDate() + d);

      if (currentDate.getFullYear() === year) {
        result.push(DateUtils.format(currentDate, 'yyyy-MM-dd'));
      }
    }

    return result;
  }

  // 새로운 메소드: 캐싱된 DOM 참조를 이용해 데이터 적용
  #applyDataToDayBars(dateMap: Record<string, string[]>, dateBarMap: Record<string, HTMLElement>) {
    for (const [date, opusList] of Object.entries(dateMap)) {
      const dayBar = dateBarMap[date] as HTMLElement;
      if (dayBar) {
        dayBar.style.height = opusList.length * 8 + 'px';
        dayBar.title = `[${date}] ${opusList.length} played\n\n${opusList.join(', ')}`;
      }
    }
  }

  #getRefDate(date) {
    const refDate = new Date(date);
    refDate.setHours(refDate.getHours() - 9);
    return refDate.toISOString().substring(0, 10);
  }
}

new Page().start();
