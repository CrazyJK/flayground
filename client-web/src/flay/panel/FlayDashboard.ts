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

    // 상위 스튜디오 (10개 + 그외)
    const studioMap = new Map<string, number>();
    for (const f of list) studioMap.set(f.studio, (studioMap.get(f.studio) || 0) + 1);
    const studioPie = this.#buildPieData(studioMap, 10);

    // 상위 배우 (이름 없거나 Amateur 제외, 10개 + 그외)
    const actressMap = new Map<string, number>();
    for (const f of list) {
      for (const name of f.actressList) {
        if (!name || name === 'Amateur') continue;
        actressMap.set(name, (actressMap.get(name) || 0) + 1);
      }
    }
    const actressPie = this.#buildPieData(actressMap, 10);

    const card = this.querySelector('#card-instance')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['Total', total.toLocaleString()],
      ['Liked', liked.toLocaleString()],
      ['평균 Score', avgScore.toFixed(1)],
      ['평균 Rank', avgRank.toFixed(1)],
      ['총 용량', (totalSize / 1024 / 1024 / 1024 / 1024).toFixed(2) + ' TB'],
      ['자막 보유', withSubtitles.toLocaleString()],
    ]);
    const pieRow = document.createElement('div');
    pieRow.className = 'pie-charts-row';
    card.querySelector('.card-body')!.appendChild(pieRow);
    this.#renderPieChart(
      pieRow,
      'Rank 분포',
      rankCounts.map((cnt, i) => [`${i}`, cnt])
    );
    this.#renderPieChart(pieRow, '상위 스튜디오', studioPie);
    this.#renderPieChart(pieRow, '상위 배우', actressPie);

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

    // 상위 스튜디오 (10개 + 그외)
    const studioMap = new Map<string, number>();
    for (const f of list) studioMap.set(f.studio, (studioMap.get(f.studio) || 0) + 1);
    const studioPie = this.#buildPieData(studioMap, 10);

    // 평균 플레이 횟수 (아카이브 전 얼마나 재생했는지)
    const avgPlay = total > 0 ? list.reduce((sum, f) => sum + f.video.play, 0) / total : 0;

    // flay 수 기준 상위 배우 (이름 없거나 Amateur 제외, 10개 + 그외)
    const actressMap = new Map<string, number>();
    for (const f of list) {
      for (const name of f.actressList) {
        if (!name || name === 'Amateur') continue;
        actressMap.set(name, (actressMap.get(name) || 0) + 1);
      }
    }
    const actressPie = this.#buildPieData(actressMap, 10);

    // Rank 분포 (0 ~ 5)
    const rankCounts = [0, 0, 0, 0, 0, 0];
    for (const f of list) {
      const r = f.video.rank;
      if (r >= 0 && r <= 5) rankCounts[r]!++;
    }

    const card = this.querySelector('#card-archive')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['Total', total.toLocaleString()],
      ['Release 범위', yearRange],
      ['평균 재생', avgPlay.toFixed(1) + '회'],
    ]);
    const pieRow = document.createElement('div');
    pieRow.className = 'pie-charts-row';
    card.querySelector('.card-body')!.appendChild(pieRow);
    this.#renderPieChart(
      pieRow,
      'Rank 분포',
      rankCounts.map((cnt, i) => [`${i}`, cnt])
    );
    this.#renderPieChart(pieRow, '상위 스튜디오', studioPie);
    this.#renderPieChart(pieRow, '상위 배우', actressPie);

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

    /**
     * 날짜 문자열(yyyy-MM-dd HH:mm:ss)을 epoch ms로 변환
     * @param dateStr - 날짜 문자열
     * @returns epoch ms
     */
    const parseDate = (dateStr: string): number => new Date(dateStr.replace(' ', 'T')).getTime();

    const firstDate = list.length > 0 ? list[list.length - 1]!.date : null;
    const lastDate = list.length > 0 ? list[0]!.date : null;

    const card = this.querySelector('#card-history')!;
    card.classList.remove('loading');
    card.querySelector('.card-body')!.innerHTML = this.#renderCardRows([
      ['마지막 플레이', lastDate ? lastDate.substring(0, 16) : '-'],
      ['히스토리 시작', firstDate ? this.#formatSince(parseDate(firstDate)) : '-'],
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

    // 월별 집계: "YYYY.MM" → count
    const monthCounts = new Map<string, number>();
    for (const flay of allFlays) {
      const ym = flay.release.substring(0, 7); // "YYYY.MM"
      if (ym.length === 7 && /^\d{4}.\d{2}$/.test(ym)) {
        monthCounts.set(ym, (monthCounts.get(ym) || 0) + 1);
      }
    }
    if (monthCounts.size === 0) return;

    // 연속 월 범위 생성
    const sortedKeys = Array.from(monthCounts.keys()).sort();
    const [startY, startM] = sortedKeys[0]!.split('.').map(Number) as [number, number];
    const [endY, endM] = sortedKeys[sortedKeys.length - 1]!.split('.').map(Number) as [number, number];

    const months: { key: string; count: number }[] = [];
    for (let y = startY, m = startM; y < endY || (y === endY && m <= endM); m++) {
      if (m > 12) {
        m = 1;
        y++;
      }
      const key = `${y}.${String(m).padStart(2, '0')}`;
      months.push({ key, count: monthCounts.get(key) || 0 });
    }

    // 고정 최대값 100건 기준 높이 계산
    const maxCount = 100;

    // 바 차트 렌더링
    let barsHtml = '';
    for (const { key, count } of months) {
      const heightPercent = Math.min((count / maxCount) * 100, 100);
      const overClass = count > maxCount ? ' over' : '';
      barsHtml += `<div class="bar${overClass}" style="height: ${heightPercent}%" title="${key}: ${count}건"></div>`;
    }

    // 연도 라벨: 매 1월에 표시
    let labelsHtml = '';
    for (const { key } of months) {
      if (key.endsWith('.01')) {
        labelsHtml += `<span>${key.substring(0, 4)}</span>`;
      }
    }

    container.innerHTML = `
      <div class="dist-title">Release 월별 분포 <span class="dist-total">${allFlays.length.toLocaleString()}건</span></div>
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

    // 1. 최근 플레이 (중복 opus 제거, 최신 10건)
    const recentPlayContainer = this.querySelector('#list-recent-play')!;
    if (recentPlayContainer.children.length === 0) {
      const seenOpus = new Set<string>();
      const recentFlays = this.#historyList
        .filter((h) => {
          if (seenOpus.has(h.opus)) return false;
          seenOpus.add(h.opus);
          return true;
        })
        .slice(0, 10)
        .map((h) => flayMap.get(h.opus))
        .filter((f): f is Flay => f !== undefined);
      this.#renderMarkerSection(recentPlayContainer, '최근 플레이', recentFlays);
    }

    // 2. 최근 Like (최신 10건)
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
        .slice(0, 10)
        .map((e) => flayMap.get(e.opus))
        .filter((f): f is Flay => f !== undefined);
      this.#renderMarkerSection(recentLikeContainer, '최근 Like', likeFlays);
    }

    // 3. 미평가 작품 (rank === 0, release 최신순, 최대 10건)
    const unrankedContainer = this.querySelector('#list-unranked')!;
    if (unrankedContainer.children.length === 0) {
      const unranked = this.#instanceList
        .filter((f) => f.video.rank === 0)
        .sort((a, b) => b.release.localeCompare(a.release))
        .slice(0, 10);
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
      grid.appendChild(new FlayMarker(flay, { tooltip: false, cover: true, shape: 'square' }));
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

  /** 파이 차트용 색상 팔레트 */
  static readonly #PIE_COLORS = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac', '#aaa'];

  /**
   * Map 데이터를 파이 차트용 [label, count] 배열로 변환.
   * 상위 topN 항목과 나머지를 "그외"로 합산.
   * @param map - 이름→건수 Map
   * @param topN - 상위 항목 수
   * @returns [label, count] 배열
   */
  #buildPieData(map: Map<string, number>, topN: number): [string, number][] {
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN).reduce((sum, [, v]) => sum + v, 0);
    if (rest > 0) top.push(['그외', rest]);
    return top;
  }

  /**
   * SVG 파이 차트를 DOM에 렌더링
   * @param container - 렌더링할 컨테이너 엘리먼트
   * @param title - 차트 제목
   * @param data - [label, count] 튜플 배열
   */
  #renderPieChart(container: Element, title: string, data: [string, number][]): void {
    if (data.length === 0) return;
    const total = data.reduce((sum, [, v]) => sum + v, 0);
    if (total === 0) return;

    const size = 80;
    const cx = size / 2,
      cy = size / 2,
      r = size / 2 - 2;
    let startAngle = -Math.PI / 2;

    let paths = '';
    for (let i = 0; i < data.length; i++) {
      const [label, value] = data[i]!;
      const sliceAngle = (value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const color = FlayDashboard.#PIE_COLORS[i % FlayDashboard.#PIE_COLORS.length]!;

      if (data.length === 1) {
        paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"><title>${label}: ${value} (${((value / total) * 100).toFixed(1)}%)</title></circle>`;
      } else {
        paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${color}"><title>${label}: ${value} (${((value / total) * 100).toFixed(1)}%)</title></path>`;
      }
      startAngle = endAngle;
    }

    const legendItems = data
      .map(([label, value], i) => {
        const color = FlayDashboard.#PIE_COLORS[i % FlayDashboard.#PIE_COLORS.length]!;
        return `<div class="pie-legend-item"><span class="pie-legend-color" style="background:${color}"></span><span class="pie-legend-label">${label}</span><span class="pie-legend-value">${value.toLocaleString()}</span></div>`;
      })
      .join('');

    const wrapper = document.createElement('div');
    wrapper.className = 'pie-chart';
    wrapper.innerHTML = `
      <div class="pie-title">${title}</div>
      <div class="pie-content">
        <svg viewBox="0 0 ${size} ${size}" class="pie-svg">${paths}</svg>
        <div class="pie-legend">${legendItems}</div>
      </div>
    `;
    container.appendChild(wrapper);
  }

  /**
   * epoch ms를 "since" 형식 문자열로 변환
   * @param epochMs - 기준 시점 epoch ms
   * @returns "N년 M개월 전" 형식 문자열
   */
  #formatSince(epochMs: number): string {
    const diff = Date.now() - epochMs;
    const days = Math.floor(diff / 86_400_000);
    if (days < 1) return '오늘';
    if (days < 30) return `${days}일 전`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}개월 전`;
    const years = Math.floor(months / 12);
    const remainMonths = months % 12;
    return remainMonths > 0 ? `${years}년 ${remainMonths}개월 전` : `${years}년 전`;
  }
}

customElements.define('flay-dashboard', FlayDashboard);
