import GroundFlay from '@base/GroundFlay';
import FlayCard from '@flay/domain/FlayCard';
import DateUtils from '@lib/common/DateUtils';
import FlayFetch, { FlayHistory } from '@lib/services/FlayFetch';
import './FlayShotDailyPanel.scss';

/** 한 페이지(스크롤 단위)에 표시할 날짜 수 */
const PAGE_SIZE = 14;
/** 새로고침 시 미리 보여줄 최근 일수 (히트맵 표시용) */
const HEATMAP_DAYS = 84; // 12주

/**
 * 일별 플레이 기록과 샷(좋아요) 기록을 시각화하는 패널.
 *
 * 구성:
 * - 상단 Hero: 누적 통계(총 샷/활동일/최다일/스트릭)와 최근 12주 샷 히트맵
 * - 본문 Timeline: 좌측 날짜 스탬프 + 우측 카드. 샷이 없는 날은 한 줄로 압축
 * - 하단 Next 버튼: 14일씩 추가 로드
 */
export class FlayShotDailyPanel extends GroundFlay {
  /** 전체 PLAY 기록 */
  #playHistoryList: FlayHistory[] = [];
  /** 날짜(yyyy-mm-dd) → 해당일 플레이된 opus 목록 */
  #playDateOpusMap: Map<string, string[]> = new Map();
  /** 날짜(yyyy-mm-dd) → 해당일 샷(좋아요)된 opus Set */
  #shotDateOpusSet: Map<string, Set<string>> = new Map();
  /** 현재까지 렌더링한 이전 일수 */
  #prevDay: number = 0;

  /** Hero 영역 (요약 통계 + 히트맵) */
  #hero: HTMLElement;
  /** 타임라인 영역 */
  #timeline: HTMLElement;
  /** 다음 페이지 버튼 */
  #nextButton: HTMLButtonElement;

  constructor() {
    super();
    this.classList.add('flay-shot-daily-panel');

    this.#hero = document.createElement('section');
    this.#hero.classList.add('shot-hero');

    this.#timeline = document.createElement('section');
    this.#timeline.classList.add('shot-timeline');

    this.#nextButton = document.createElement('button');
    this.#nextButton.classList.add('shot-next');
    this.#nextButton.type = 'button';
    this.#nextButton.innerHTML = `<span class="next-label">더 거슬러 가기</span><span class="next-sub">+${PAGE_SIZE}일</span>`;
    this.#nextButton.addEventListener('click', () => void this.#showHistory());

    this.appendChild(this.#hero);
    this.appendChild(this.#timeline);
    this.appendChild(this.#nextButton);
  }

  connectedCallback() {
    void this.#bootstrap();
  }

  /** 데이터 로드 → Hero 렌더 → 첫 페이지 렌더 */
  async #bootstrap(): Promise<void> {
    await this.#fetchPlayHistories();
    this.#renderHero();
    await this.#showHistory();
  }

  /** PLAY 기록을 받아 날짜별 맵으로 정리 (오전 9시 보정 포함) */
  async #fetchPlayHistories(): Promise<void> {
    this.#playHistoryList = await FlayFetch.getHistoryListByAction('PLAY');

    for (const history of this.#playHistoryList) {
      const refDate = this.#getRefDate(history.date);
      const opusList = this.#playDateOpusMap.get(refDate) ?? [];
      if (!opusList.includes(history.opus)) {
        opusList.push(history.opus);
        this.#playDateOpusMap.set(refDate, opusList);
      }
    }

    // 좋아요(샷) 데이터를 만들기 위해 각 opus의 video.likes는 #render 단계에서 카드 단위로 확인.
    // Hero 통계용으로는 history만으로 부족하므로 별도 lazy 채움.
  }

  /** Hero(요약 통계 + 히트맵) 렌더 */
  #renderHero(): void {
    // 통계 카운팅 (히스토리 기반: 활동일 = play가 있는 날 수)
    const activeDays = this.#playDateOpusMap.size;
    const totalPlays = Array.from(this.#playDateOpusMap.values()).reduce((sum, list) => sum + list.length, 0);
    const maxDay = Array.from(this.#playDateOpusMap.entries()).reduce<{ date: string; count: number }>(
      (best, [date, list]) => (list.length > best.count ? { date, count: list.length } : best),
      { date: '-', count: 0 }
    );
    const streak = this.#calcCurrentStreak();

    // 최근 N일 히트맵 (play 횟수 기준 강도 0~4)
    const heatmapCells: string[] = [];
    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
      const date = this.#getDate(i);
      const count = this.#playDateOpusMap.get(date)?.length ?? 0;
      const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
      heatmapCells.push(`<i class="cell" data-level="${level}" title="${date} · ${count}편"></i>`);
    }

    this.#hero.innerHTML = `
      <div class="hero-title">
        <h3>Shot Diary</h3>
        <p>매일의 플레이 흔적을 따라가는 일지</p>
      </div>
      <div class="hero-stats">
        <div class="stat"><b>${totalPlays.toLocaleString()}</b><span>누적 플레이</span></div>
        <div class="stat"><b>${activeDays.toLocaleString()}</b><span>활동일</span></div>
        <div class="stat"><b>${maxDay.count}</b><span>최다 ${maxDay.date}</span></div>
        <div class="stat"><b>${streak}</b><span>현재 스트릭(일)</span></div>
      </div>
      <div class="hero-heatmap" aria-label="최근 ${HEATMAP_DAYS}일 활동 히트맵">
        <div class="cells">${heatmapCells.join('')}</div>
        <div class="legend">
          <span>적음</span>
          <i data-level="0"></i><i data-level="1"></i><i data-level="2"></i><i data-level="3"></i><i data-level="4"></i>
          <span>많음</span>
        </div>
      </div>
    `;
  }

  /** 오늘 기준 연속 활동일 계산 */
  #calcCurrentStreak(): number {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const date = this.#getDate(i);
      if (this.#playDateOpusMap.has(date)) {
        streak++;
      } else if (i === 0) {
        // 오늘 활동이 없으면 어제부터 카운트 시도
        continue;
      } else {
        break;
      }
    }
    return streak;
  }

  /** PAGE_SIZE만큼 추가 렌더 */
  async #showHistory(): Promise<void> {
    this.#nextButton.disabled = true;
    const end = this.#prevDay + PAGE_SIZE;
    for (; this.#prevDay < end; this.#prevDay++) {
      const date = this.#getDate(this.#prevDay);
      const opusList = this.#playDateOpusMap.get(date) ?? [];
      await this.#renderDay(date, opusList);
    }
    this.#nextButton.disabled = false;
  }

  /** 한 날짜 행을 렌더링 */
  async #renderDay(refDate: string, opusList: string[]): Promise<void> {
    const isEmpty = opusList.length === 0;

    const row = document.createElement('article');
    row.classList.add('day-row');
    row.classList.toggle('day-empty', isEmpty);
    row.dataset.date = refDate;

    const dow = DateUtils.getDayOfWeek(refDate);
    const [yyyy, mm, dd] = refDate.split('-');

    row.innerHTML = `
      <header class="day-stamp">
        <span class="dow">${dow}</span>
        <span class="dd">${dd}</span>
        <span class="ym">${yyyy}.${mm}</span>
      </header>
      <div class="day-body">
        <div class="day-meta"></div>
        <div class="card-list"></div>
      </div>
    `;

    this.#timeline.appendChild(row);

    if (isEmpty) {
      const meta = row.querySelector('.day-meta') as HTMLElement;
      meta.textContent = '· 조용한 하루 ·';
      return;
    }

    // 카드 렌더 (FlayCard로 상세 표시)
    const cardList = row.querySelector('.card-list') as HTMLElement;
    let shotCount = 0;
    for (const opus of opusList) {
      const flayCard = new FlayCard({ excludes: ['FlayTag', 'FlayComment', 'FlayFiles'] });
      const fullyFlay = await flayCard.set(opus, undefined);
      const likeCount = fullyFlay?.flay.video.likes?.filter((likeDate) => this.#getRefDate(likeDate) === refDate).length ?? 0;
      const isShot = likeCount > 0;
      flayCard.classList.toggle('shot', isShot);
      if (isShot) {
        shotCount++;
        const set = this.#shotDateOpusSet.get(refDate) ?? new Set<string>();
        set.add(opus);
        this.#shotDateOpusSet.set(refDate, set);
      }
      cardList.appendChild(flayCard);
    }

    // 메타 (플레이 수 / 샷 수 / 비율 게이지)
    const meta = row.querySelector('.day-meta') as HTMLElement;
    const ratio = opusList.length === 0 ? 0 : Math.round((shotCount / opusList.length) * 100);
    row.classList.toggle('has-shot', shotCount > 0);
    meta.innerHTML = `
      <span class="meta-tag plays">▶ ${opusList.length}편</span>
      <span class="meta-tag shots">♥ ${shotCount}샷</span>
      <span class="meta-gauge" title="샷 비율 ${ratio}%">
        <i style="width:${ratio}%"></i>
        <em>${ratio}%</em>
      </span>
    `;
  }

  /**
   * 오늘 기준 priorDay만큼 이전 날짜
   * @param priorDay 0=오늘, 1=어제, ...
   */
  #getDate(priorDay: number): string {
    const d = new Date();
    d.setDate(d.getDate() - priorDay);
    return DateUtils.format(d, DateUtils.FORMATS.DATE);
  }

  /**
   * 샷의 기준 날짜 (오전 9시까지를 같은 날로 간주)
   */
  #getRefDate(date: string | number): string {
    const refDate = new Date(date);
    refDate.setHours(refDate.getHours() - 9);
    return DateUtils.format(refDate, DateUtils.FORMATS.DATE);
  }
}

customElements.define('flay-shot-daily-panel', FlayShotDailyPanel);
