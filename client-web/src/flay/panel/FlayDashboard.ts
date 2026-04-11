import GroundFlay from '@base/GroundFlay';
import FlayFetch, { type Actress, type Archive, type Flay, type FlayHistory } from '@lib/FlayFetch';
import { popupFlay } from '@lib/FlaySearch';
import './FlayDashboard.scss';

/**
 * Flay 대시보드 커스텀 엘리먼트.
 * Instance, Archive, Actress, History 4개 카드와 하단 리스트를 표시한다.
 * 각 API를 개별 비동기 호출하여 도착 즉시 렌더링.
 */
export default class FlayDashboard extends GroundFlay {
  /** 섹션 간 데이터 공유용 */
  #instanceList: Flay[] | null = null;
  #archiveList: Archive[] | null = null;
  #actressList: Actress[] | null = null;
  #historyList: FlayHistory[] | null = null;

  connectedCallback(): void {
    this.innerHTML = /* html */ `
      <div class="dashboard-header">Flay Dashboard</div>
      <div class="card-grid">
        <div class="card loading" id="card-instance">
          <div class="card-title">Instance</div>
          <div class="card-body"><span class="spinner"></span></div>
        </div>
        <div class="card loading" id="card-archive">
          <div class="card-title">Archive</div>
          <div class="card-body"><span class="spinner"></span></div>
        </div>
        <div class="card loading" id="card-actress">
          <div class="card-title">Actress</div>
          <div class="card-body"><span class="spinner"></span></div>
        </div>
        <div class="card loading" id="card-history">
          <div class="card-title">History</div>
          <div class="card-body"><span class="spinner"></span></div>
        </div>
      </div>
      <div class="release-dist" id="release-dist"></div>
      <div class="list-section" id="list-recent-play"></div>
      <div class="list-section" id="list-recent-like"></div>
      <div class="list-section" id="list-unranked"></div>
    `;

    // 개별 비동기 호출 — 도착 즉시 렌더링
    void this.#loadInstanceCard();
    void this.#loadArchiveCard();
    void this.#loadActressCard();
    void this.#loadHistoryCard();
  }

  // ─── Instance 카드 ──────────────────────────────────────

  /**
   * Instance 데이터를 로드하고 카드를 렌더링한다.
   */
  async #loadInstanceCard(): Promise<void> {
    const list = await FlayFetch.getFlayAll();
    this.#instanceList = list;

    // 통계 계산
    const total = list.length;
    const liked = list.filter((f) => f.video.likes.length > 0).length;
    const likesSum = list.reduce((sum, f) => sum + f.video.likes.length, 0);
    const avgScore = total > 0 ? list.reduce((sum, f) => sum + f.score, 0) / total : 0;
    const rankedList = list.filter((f) => f.video.rank > 0);
    const avgRank = rankedList.length > 0 ? rankedList.reduce((sum, f) => sum + f.video.rank, 0) / rankedList.length : 0;
    const totalSize = list.reduce((sum, f) => sum + f.length, 0);
    const withSubtitles = list.filter((f) => f.files.subtitles.length > 0).length;

    // 랭크별 분포 (0 ~ 5)
    const rankCounts = [0, 0, 0, 0, 0, 0];
    for (const f of list) {
      const r = f.video.rank;
      if (r >= 0 && r <= 5) rankCounts[r]!++;
    }

    const card = this.querySelector('#card-instance')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['Total', total.toLocaleString()],
      ['Liked', liked.toLocaleString()],
      ['Likes 합계', likesSum.toLocaleString()],
      ['평균 Score', avgScore.toFixed(1)],
      ['평균 Rank', avgRank.toFixed(1)],
      ...rankCounts.map((cnt, i) => [`Rank ${i}`, cnt.toLocaleString()] as [string, string]),
      ['총 용량', (totalSize / 1024 / 1024 / 1024 / 1024).toFixed(2) + ' TB'],
      ['자막 보유', withSubtitles.toLocaleString()],
    ]);

    this.#tryRenderDependentSections();
  }

  // ─── Archive 카드 ──────────────────────────────────────

  /**
   * Archive 데이터를 로드하고 카드를 렌더링한다.
   */
  async #loadArchiveCard(): Promise<void> {
    const list = await FlayFetch.getArchiveAll();
    this.#archiveList = list;

    const total = list.length;

    // 연도 범위
    const years = list.map((f) => parseInt(f.release.substring(0, 4), 10)).filter((y) => !isNaN(y));
    const yearRange = years.length > 0 ? `${Math.min(...years)} ~ ${Math.max(...years)}` : '-';

    // 상위 스튜디오 (최다 3개)
    const studioMap = new Map<string, number>();
    for (const f of list) studioMap.set(f.studio, (studioMap.get(f.studio) || 0) + 1);
    const topStudios = Array.from(studioMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, cnt]) => `${name}(${cnt})`)
      .join(', ');

    // 평균 플레이 횟수 (아카이브 전 얼마나 재생했는지)
    const avgPlay = total > 0 ? list.reduce((sum, f) => sum + f.video.play, 0) / total : 0;

    const card = this.querySelector('#card-archive')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['Total', total.toLocaleString()],
      ['Release 범위', yearRange],
      ['평균 재생', avgPlay.toFixed(1) + '회'],
      ['상위 스튜디오', topStudios || '-'],
    ]);

    this.#tryRenderDependentSections();
  }

  // ─── Actress 카드 ──────────────────────────────────────

  /**
   * Actress 데이터를 로드한다.
   * Instance + Archive가 모두 도착해야 카드를 렌더링할 수 있다.
   */
  async #loadActressCard(): Promise<void> {
    this.#actressList = await FlayFetch.getActressAll();
    this.#tryRenderActressCard();
  }

  /**
   * Instance + Archive + Actress 데이터가 모두 준비된 경우에만 렌더링.
   */
  #tryRenderActressCard(): void {
    if (!this.#instanceList || !this.#archiveList || !this.#actressList) return;

    const allFlays = [...this.#instanceList, ...this.#archiveList];
    const actressCountMap = new Map<string, number>();
    for (const flay of allFlays) {
      for (const name of flay.actressList) {
        actressCountMap.set(name, (actressCountMap.get(name) || 0) + 1);
      }
    }

    // 2회 이상 출현 배우만 필터
    const multiAppearActress = this.#actressList.filter((a) => (actressCountMap.get(a.name) || 0) >= 2);
    const instanceActressSet = new Set(this.#instanceList.flatMap((f) => f.actressList));
    const archiveActressSet = new Set(this.#archiveList.flatMap((f) => f.actressList));

    const activeCount = multiAppearActress.filter((a) => instanceActressSet.has(a.name)).length;
    const archivedCount = multiAppearActress.filter((a) => !instanceActressSet.has(a.name) && archiveActressSet.has(a.name)).length;

    const card = this.querySelector('#card-actress')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['전체 배우', this.#actressList.length.toLocaleString()],
      ['2회+ 출현', multiAppearActress.length.toLocaleString()],
      ['선호 배우', multiAppearActress.filter((a) => a.favorite).length.toLocaleString()],
      ['보유 중', activeCount.toLocaleString()],
      ['아카이브', archivedCount.toLocaleString()],
    ]);
  }

  // ─── History 카드 ──────────────────────────────────────

  /**
   * History 데이터를 로드하고 카드를 렌더링한다.
   */
  async #loadHistoryCard(): Promise<void> {
    const list = await FlayFetch.getHistoryListByAction('PLAY', 0);
    this.#historyList = list;

    const now = Date.now();
    const DAY_MS = 86_400_000;

    /**
     * 날짜 문자열(yyyy-MM-dd HH:mm:ss)을 epoch ms로 변환
     * @param dateStr - 날짜 문자열
     * @returns epoch ms
     */
    const parseDate = (dateStr: string): number => new Date(dateStr.replace(' ', 'T')).getTime();

    const totalPlays = list.length;
    const last7days = list.filter((h) => now - parseDate(h.date) < 7 * DAY_MS).length;
    const last30days = list.filter((h) => now - parseDate(h.date) < 30 * DAY_MS).length;
    const lastPlayDate = list.length > 0 ? list[0]!.date : '-';
    const uniqueOpus = new Set(list.map((h) => h.opus)).size;

    const card = this.querySelector('#card-history')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['총 플레이', totalPlays.toLocaleString()],
      ['최근 7일', last7days.toLocaleString()],
      ['최근 30일', last30days.toLocaleString()],
      ['마지막 플레이', lastPlayDate.substring(0, 16)],
      ['고유 작품', uniqueOpus.toLocaleString()],
    ]);

    this.#tryRenderDependentSections();
  }

  // ─── 의존 섹션 렌더링 ──────────────────────────────────

  /**
   * Instance + Archive + History 등 의존 데이터가 모두 준비됐을 때 추가 섹션 렌더링
   */
  #tryRenderDependentSections(): void {
    // Actress 카드: Instance + Archive + Actress 필요
    this.#tryRenderActressCard();

    // Release 분포: Instance + Archive 필요
    if (this.#instanceList && this.#archiveList) {
      this.#renderReleaseDist();
    }

    // 하단 리스트: Instance + History 필요
    if (this.#instanceList && this.#historyList) {
      this.#renderLists();
    }
  }

  // ─── Release 연도별 분포 ───────────────────────────────

  /**
   * Instance + Archive 합산 연도별 release 분포를 바 차트로 렌더링
   */
  #renderReleaseDist(): void {
    const container = this.querySelector('#release-dist')!;
    if (container.children.length > 0) return; // 이미 렌더링됨
    if (!this.#instanceList || !this.#archiveList) return;

    const allFlays = [...this.#instanceList, ...this.#archiveList];
    const yearCounts = new Map<number, number>();
    for (const flay of allFlays) {
      const year = parseInt(flay.release.substring(0, 4), 10);
      if (!isNaN(year) && year >= 2000) {
        yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
      }
    }

    if (yearCounts.size === 0) return;

    // 연도 범위 계산
    const years = Array.from(yearCounts.keys()).sort((a, b) => a - b);
    const minYear = years[0]!;
    const maxYear = years[years.length - 1]!;
    const maxCount = Math.max(...yearCounts.values());

    // 바 차트 렌더링
    let barsHtml = '';
    let labelsHtml = '';
    for (let y = minYear; y <= maxYear; y++) {
      const count = yearCounts.get(y) || 0;
      const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
      barsHtml += `<div class="bar" style="height: ${heightPercent}%" title="${y}: ${count}건"></div>`;
      // 5년 간격으로 라벨 표시
      if (y === minYear || y === maxYear || y % 5 === 0) {
        labelsHtml += `<span>${y}</span>`;
      }
    }

    container.innerHTML = `
      <div class="dist-title">Release 연도별 분포</div>
      <div class="spark-row">${barsHtml}</div>
      <div class="year-labels">${labelsHtml}</div>
    `;
  }

  // ─── 하단 리스트 ────────────────────────────────────────

  /**
   * 최근 플레이, 최근 Like, 미평가 작품 리스트를 렌더링
   */
  #renderLists(): void {
    if (!this.#instanceList || !this.#historyList) return;

    // Flay를 opus 기준 Map으로 캐싱
    const flayMap = new Map<string, Flay>();
    for (const flay of this.#instanceList) {
      flayMap.set(flay.opus, flay);
    }

    // 1. 최근 플레이 목록 (최신 10건, 중복 opus 제거)
    const recentPlayContainer = this.querySelector('#list-recent-play')!;
    if (recentPlayContainer.children.length === 0) {
      const seenOpus = new Set<string>();
      const recentPlays = this.#historyList
        .filter((h) => {
          if (seenOpus.has(h.opus)) return false;
          seenOpus.add(h.opus);
          return true;
        })
        .slice(0, 10);
      recentPlayContainer.innerHTML = `
        <div class="list-title">최근 플레이</div>
        ${recentPlays
          .map((h) => {
            const flay = flayMap.get(h.opus);
            return this.#renderListItem(h.opus, flay?.title || '', flay?.actressList.join(', ') || '', h.date.substring(0, 10));
          })
          .join('')}
      `;
      this.#bindListItemClicks(recentPlayContainer);
    }

    // 2. 최근 Like 목록 (최신 10건)
    const recentLikeContainer = this.querySelector('#list-recent-like')!;
    if (recentLikeContainer.children.length === 0) {
      const likeEntries: { opus: string; timestamp: number }[] = [];
      for (const flay of this.#instanceList) {
        for (const ts of flay.video.likes) {
          likeEntries.push({ opus: flay.opus, timestamp: ts });
        }
      }
      likeEntries.sort((a, b) => b.timestamp - a.timestamp);
      const recentLikes = likeEntries.slice(0, 10);

      recentLikeContainer.innerHTML = `
        <div class="list-title">최근 Like</div>
        ${recentLikes
          .map((entry) => {
            const flay = flayMap.get(entry.opus);
            const dateStr = new Date(entry.timestamp).toISOString().substring(0, 10);
            return this.#renderListItem(entry.opus, flay?.title || '', flay?.actressList.join(', ') || '', dateStr);
          })
          .join('')}
      `;
      this.#bindListItemClicks(recentLikeContainer);
    }

    // 3. 미평가 작품 (rank === 0, release 최신순, 최대 10건)
    const unrankedContainer = this.querySelector('#list-unranked')!;
    if (unrankedContainer.children.length === 0) {
      const unranked = this.#instanceList
        .filter((f) => f.video.rank === 0)
        .sort((a, b) => b.release.localeCompare(a.release))
        .slice(0, 10);

      unrankedContainer.innerHTML = `
        <div class="list-title">미평가 작품</div>
        ${unranked.map((f) => this.#renderListItem(f.opus, f.title, f.actressList.join(', '), f.release.substring(0, 10))).join('')}
      `;
      this.#bindListItemClicks(unrankedContainer);
    }
  }

  // ─── 유틸리티 ──────────────────────────────────────────

  /**
   * 카드 행(label + value) HTML을 생성
   * @param rows - [label, value] 튜플 배열
   * @returns 카드 행 HTML 문자열
   */
  #renderCardRows(rows: [string, string][]): string {
    return rows
      .map(
        ([label, value]) => `
      <div class="card-row">
        <span class="label">${label}</span>
        <span class="value">${value}</span>
      </div>
    `
      )
      .join('');
  }

  /**
   * 리스트 아이템 HTML을 생성
   * @param opus - 작품 코드
   * @param title - 제목
   * @param actress - 배우명
   * @param date - 날짜 문자열
   * @returns 리스트 아이템 HTML 문자열
   */
  #renderListItem(opus: string, title: string, actress: string, date: string): string {
    return `
      <div class="list-item" data-opus="${opus}">
        <span class="opus">${opus}</span>
        <span class="title">${title}</span>
        <span class="actress">${actress}</span>
        <span class="date">${date}</span>
      </div>
    `;
  }

  /**
   * 리스트 컨테이너 내 아이템 클릭 이벤트를 바인딩
   * @param container - 리스트 컨테이너 엘리먼트
   */
  #bindListItemClicks(container: Element): void {
    for (const item of container.querySelectorAll('.list-item')) {
      item.addEventListener('click', () => {
        const opus = (item as HTMLElement).dataset['opus'];
        if (opus) popupFlay(opus);
      });
    }
  }
}

customElements.define('flay-dashboard', FlayDashboard);
