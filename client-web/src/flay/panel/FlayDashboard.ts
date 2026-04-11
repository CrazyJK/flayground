import GroundFlay from '@base/GroundFlay';
import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { type Actress, type Archive, type Flay, type FlayHistory } from '@lib/FlayFetch';
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
      <div class="card-row-layout">
        <div class="card loading" id="card-instance">
          <div class="card-title">Instance</div>
          <div class="card-body"><span class="spinner"></span></div>
        </div>
        <div class="card loading" id="card-archive">
          <div class="card-title">Archive</div>
          <div class="card-body"><span class="spinner"></span></div>
        </div>
      </div>
      <div class="card-grid">
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
      <div class="marker-section" id="list-recent-play"></div>
      <div class="marker-section" id="list-recent-like"></div>
      <div class="marker-section" id="list-unranked"></div>
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

    // Rank 한줄 요약: "0:12 1:34 2:56 3:78 4:90 5:23"
    const rankSummary = rankCounts.map((cnt, i) => `${i}:${cnt}`).join(' ');

    const card = this.querySelector('#card-instance')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['Total', total.toLocaleString()],
      ['Liked', liked.toLocaleString()],
      ['Likes 합계', likesSum.toLocaleString()],
      ['평균 Score', avgScore.toFixed(1)],
      ['평균 Rank', avgRank.toFixed(1)],
      ['Rank 분포', rankSummary],
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

    // flay 수 기준 상위 배우 5명
    const actressMap = new Map<string, number>();
    for (const f of list) {
      for (const name of f.actressList) {
        actressMap.set(name, (actressMap.get(name) || 0) + 1);
      }
    }
    const topActresses = Array.from(actressMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, cnt]) => `${name}(${cnt})`)
      .join(', ');

    const card = this.querySelector('#card-archive')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['Total', total.toLocaleString()],
      ['Release 범위', yearRange],
      ['평균 재생', avgPlay.toFixed(1) + '회'],
      ['상위 스튜디오', topStudios || '-'],
      ['상위 배우', topActresses || '-'],
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

    const instanceActressSet = new Set(this.#instanceList.flatMap((f) => f.actressList));
    const archiveActressSet = new Set(this.#archiveList.flatMap((f) => f.actressList));

    const activeCount = this.#actressList.filter((a) => instanceActressSet.has(a.name)).length;
    const archivedCount = this.#actressList.filter((a) => !instanceActressSet.has(a.name) && archiveActressSet.has(a.name)).length;

    const card = this.querySelector('#card-actress')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['전체 배우', this.#actressList.length.toLocaleString()],
      ['선호 배우', this.#actressList.filter((a) => a.favorite).length.toLocaleString()],
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
    if (container.children.length > 0) return;
    if (!this.#instanceList || !this.#archiveList) return;

    const allFlays = [...this.#instanceList, ...this.#archiveList];

    // 월별 집계: "YYYY-MM" → count
    const monthCounts = new Map<string, number>();
    for (const flay of allFlays) {
      const ym = flay.release.substring(0, 7); // "YYYY-MM"
      if (ym.length === 7 && ym[4] === '-') {
        monthCounts.set(ym, (monthCounts.get(ym) || 0) + 1);
      }
    }
    if (monthCounts.size === 0) return;

    // 연속 월 범위 생성
    const sortedKeys = Array.from(monthCounts.keys()).sort();
    const [startY, startM] = sortedKeys[0]!.split('-').map(Number) as [number, number];
    const [endY, endM] = sortedKeys[sortedKeys.length - 1]!.split('-').map(Number) as [number, number];

    const months: { key: string; count: number }[] = [];
    for (let y = startY, m = startM; y < endY || (y === endY && m <= endM); m++) {
      if (m > 12) {
        m = 1;
        y++;
      }
      const key = `${y}-${String(m).padStart(2, '0')}`;
      months.push({ key, count: monthCounts.get(key) || 0 });
    }

    // 이상치 억제: p95 percentile 기준 클램프
    const counts = months
      .map((m) => m.count)
      .filter((c) => c > 0)
      .sort((a, b) => a - b);
    const p95 = counts[Math.floor(counts.length * 0.95)] || 1;
    const maxDisplay = Math.max(p95, 1);

    // 바 차트 렌더링
    let barsHtml = '';
    for (const { key, count } of months) {
      const clamped = Math.min(count, maxDisplay);
      const heightPercent = (clamped / maxDisplay) * 100;
      const overClass = count > maxDisplay ? ' over' : '';
      barsHtml += `<div class="bar${overClass}" style="height: ${heightPercent}%" title="${key}: ${count}건"></div>`;
    }

    // 연도 라벨: 매 1월에 표시
    let labelsHtml = '';
    for (const { key } of months) {
      if (key.endsWith('-01')) {
        labelsHtml += `<span>${key.substring(0, 4)}</span>`;
      }
    }

    container.innerHTML = `
      <div class="dist-title">Release 월별 분포</div>
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

    // 1. 최근 플레이 (중복 opus 제거, 최신 20건)
    const recentPlayContainer = this.querySelector('#list-recent-play')!;
    if (recentPlayContainer.children.length === 0) {
      const seenOpus = new Set<string>();
      const recentFlays = this.#historyList
        .filter((h) => {
          if (seenOpus.has(h.opus)) return false;
          seenOpus.add(h.opus);
          return true;
        })
        .slice(0, 20)
        .map((h) => flayMap.get(h.opus))
        .filter((f): f is Flay => f !== undefined);
      this.#renderMarkerSection(recentPlayContainer, '최근 플레이', recentFlays);
    }

    // 2. 최근 Like (최신 20건)
    const recentLikeContainer = this.querySelector('#list-recent-like')!;
    if (recentLikeContainer.children.length === 0) {
      const likeEntries: { opus: string; timestamp: number }[] = [];
      for (const flay of this.#instanceList) {
        for (const ts of flay.video.likes) {
          likeEntries.push({ opus: flay.opus, timestamp: ts });
        }
      }
      likeEntries.sort((a, b) => b.timestamp - a.timestamp);
      const likeFlays = likeEntries
        .slice(0, 20)
        .map((e) => flayMap.get(e.opus))
        .filter((f): f is Flay => f !== undefined);
      this.#renderMarkerSection(recentLikeContainer, '최근 Like', likeFlays);
    }

    // 3. 미평가 작품 (rank === 0, release 최신순, 최대 20건)
    const unrankedContainer = this.querySelector('#list-unranked')!;
    if (unrankedContainer.children.length === 0) {
      const unranked = this.#instanceList
        .filter((f) => f.video.rank === 0)
        .sort((a, b) => b.release.localeCompare(a.release))
        .slice(0, 20);
      this.#renderMarkerSection(unrankedContainer, '미평가 작품', unranked);
    }
  }

  /**
   * FlayMarker 사각형 그리드로 섹션을 렌더링
   * @param container - 렌더링할 컨테이너 엘리먼트
   * @param title - 섹션 제목
   * @param flays - 표시할 Flay 목록
   */
  #renderMarkerSection(container: Element, title: string, flays: Flay[]): void {
    const titleEl = document.createElement('div');
    titleEl.className = 'section-title';
    titleEl.textContent = title;
    container.appendChild(titleEl);

    const grid = document.createElement('div');
    grid.className = 'marker-grid';
    for (const flay of flays) {
      grid.appendChild(new FlayMarker(flay, { tooltip: true, shape: 'square' }));
    }
    container.appendChild(grid);
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
}

customElements.define('flay-dashboard', FlayDashboard);
