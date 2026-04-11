import GroundFlay from '@base/GroundFlay';
import FlayFetch, { type Actress, type Archive, type Flay } from '@lib/FlayFetch';
import './FlayDashboard.scss';

/**
 * Flay 대시보드 커스텀 엘리먼트.
 * Instance, Archive, Actress, History 4개 카드와 Release 분포를 표시한다.
 * 각 API를 개별 비동기 호출하여 도착 즉시 렌더링.
 */
export default class FlayDashboard extends GroundFlay {
  /** 섹션 간 데이터 공유용 */
  #instanceList: Flay[] | null = null;
  #archiveList: Archive[] | null = null;
  #actressList: Actress[] | null = null;

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

    // 상위 스튜디오 (비율 2% 이상, 최대 20개 + 그외)
    const studioMap = new Map<string, number>();
    for (const f of list) studioMap.set(f.studio, (studioMap.get(f.studio) || 0) + 1);
    const studioPie = this.#buildPieData(studioMap);

    // 상위 배우 (이름 없거나 Amateur 제외, 비율 2% 이상, 최대 20개 + 그외)
    const actressMap = new Map<string, number>();
    for (const f of list) {
      for (const name of f.actressList) {
        if (!name || name === 'Amateur') continue;
        actressMap.set(name, (actressMap.get(name) || 0) + 1);
      }
    }
    const actressPie = this.#buildPieData(actressMap);

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
      rankCounts.map((cnt, i) => [`${i}`, cnt]),
      true
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

    // 상위 스튜디오 (비율 2% 이상, 최대 20개 + 그외)
    const studioMap = new Map<string, number>();
    for (const f of list) studioMap.set(f.studio, (studioMap.get(f.studio) || 0) + 1);
    const studioPie = this.#buildPieData(studioMap);

    // 평균 플레이 횟수 (아카이브 전 얼마나 재생했는지)
    const avgPlay = total > 0 ? list.reduce((sum, f) => sum + f.video.play, 0) / total : 0;

    // flay 수 기준 상위 배우 (이름 없거나 Amateur 제외, 비율 2% 이상, 최대 20개 + 그외)
    const actressMap = new Map<string, number>();
    for (const f of list) {
      for (const name of f.actressList) {
        if (!name || name === 'Amateur') continue;
        actressMap.set(name, (actressMap.get(name) || 0) + 1);
      }
    }
    const actressPie = this.#buildPieData(actressMap);

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
      rankCounts.map((cnt, i) => [`${i}`, cnt]),
      true
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
   * 전체 대비 비율이 minRatio 이상인 항목만 개별 표시하고, 나머지는 "그외"로 합산.
   * @param map - 이름→건수 Map
   * @param minRatio - 개별 표시 최소 비율 (기본 2%)
   * @param maxItems - 최대 항목 수 (기본 20)
   * @returns [label, count] 배열
   */
  #buildPieData(map: Map<string, number>, minRatio = 0.02, maxItems = 20): [string, number][] {
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.filter(([, v]) => v / total >= minRatio).slice(0, maxItems);
    const rest = total - top.reduce((s, [, v]) => s + v, 0);
    if (rest > 0) top.push(['그외', rest]);
    return top;
  }

  /**
   * SVG 파이 차트를 DOM에 렌더링
   * @param container - 렌더링할 컨테이너 엘리먼트
   * @param title - 차트 제목
   * @param data - [label, count] 튜플 배열
   */
  #renderPieChart(container: Element, title: string, data: [string, number][], showLegend = false): void {
    if (data.length === 0) return;
    const total = data.reduce((sum, [, v]) => sum + v, 0);
    if (total === 0) return;

    const size = 100;
    const cx = size / 2,
      cy = size / 2,
      r = size / 2 - 1;
    let startAngle = -Math.PI / 2;

    let paths = '';
    let labels = '';
    const labelPositions: { x: number; y: number; text: string }[] = [];
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
      const titleText = `${label}: ${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`;

      if (data.length === 1) {
        paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"><title>${titleText}</title></circle>`;
      } else {
        paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${color}"><title>${titleText}</title></path>`;
      }

      // showLegend: 라벨 위치 수집 (겹침 보정 후 렌더링)
      if (showLegend && value > 0) {
        const midAngle = startAngle + sliceAngle / 2;
        const labelR = r * 0.6;
        labelPositions.push({
          x: cx + labelR * Math.cos(midAngle),
          y: cy + labelR * Math.sin(midAngle),
          text: `${label}: ${value.toLocaleString()}`,
        });
      }

      startAngle = endAngle;
    }

    // 라벨 Y축 겹침 보정: 다중 패스로 인접 라벨 간격 확보
    if (labelPositions.length > 1) {
      const minGap = 8;
      labelPositions.sort((a, b) => a.y - b.y);
      for (let pass = 0; pass < 10; pass++) {
        let adjusted = false;
        for (let i = 1; i < labelPositions.length; i++) {
          const gap = labelPositions[i]!.y - labelPositions[i - 1]!.y;
          if (gap < minGap) {
            const shift = (minGap - gap) / 2;
            labelPositions[i - 1]!.y -= shift;
            labelPositions[i]!.y += shift;
            adjusted = true;
          }
        }
        if (!adjusted) break;
      }
      // SVG 영역 내 클램프
      for (const lp of labelPositions) {
        lp.y = Math.max(6, Math.min(size - 4, lp.y));
      }
    }
    for (const lp of labelPositions) {
      labels += `<text x="${lp.x}" y="${lp.y}" text-anchor="middle" dominant-baseline="central" class="pie-label">${lp.text}</text>`;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'pie-chart';
    wrapper.innerHTML = `
      <div class="pie-title">${title}</div>
      <svg viewBox="0 0 ${size} ${size}" class="pie-svg">${paths}${labels}</svg>
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
