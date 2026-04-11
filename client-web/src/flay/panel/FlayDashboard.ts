import GroundFlay from '@base/GroundFlay';
import FlayFetch, { type Actress, type Archive, type Flay } from '@lib/FlayFetch';
import { popupActress, popupStudio } from '@lib/FlaySearch';
import { BarChart, PieChart, TreemapChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import './FlayDashboard.scss';

echarts.use([PieChart, BarChart, TreemapChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

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
  /** ECharts 인스턴스 관리 (리사이즈 대응용) */
  #charts: echarts.ECharts[] = [];

  /**
   * ECharts 인스턴스 등록 + 다음 프레임에 리사이즈 예약
   * @param chart - 등록할 ECharts 인스턴스
   */
  #registerChart(chart: echarts.ECharts): void {
    this.#charts.push(chart);
    requestAnimationFrame(() => chart.resize());
  }

  /**
   * 페이지 테마 CSS 변수를 읽어 ECharts tooltip 공통 스타일 옵션을 반환
   * @returns ECharts tooltip 스타일 옵션 객체
   */
  #getTooltipStyle(): Record<string, unknown> {
    const s = getComputedStyle(this);
    return {
      backgroundColor: s.getPropertyValue('--color-bg').trim(),
      borderColor: s.getPropertyValue('--color-border').trim(),
      textStyle: { color: s.getPropertyValue('--color-text').trim(), fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: 12 },
      extraCssText: `border-radius: ${s.getPropertyValue('--border-radius-hugest').trim()}; box-shadow: ${s.getPropertyValue('--box-shadow-smallest').trim()};`,
    };
  }

  connectedCallback(): void {
    this.innerHTML = /* html */ `
      <div class="dashboard-header">Flay Dashboard</div>
      <div class="card-row-layout">
        <div class="card loading" id="card-instance">
          <div class="card-title">Instance</div>
          <div class="card-body">
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value short"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value short"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value short"></span></div>
            <div class="skeleton-charts"><div class="skeleton-chart"></div><div class="skeleton-chart"></div><div class="skeleton-chart"></div></div>
          </div>
        </div>
        <div class="card loading" id="card-archive">
          <div class="card-title">Archive</div>
          <div class="card-body">
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value short"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
            <div class="skeleton-charts"><div class="skeleton-chart"></div><div class="skeleton-chart"></div><div class="skeleton-chart"></div></div>
          </div>
        </div>
      </div>
      <div class="card-grid">
        <div class="card loading" id="card-actress">
          <div class="card-title">Actress</div>
          <div class="card-body">
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value short"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value short"></span></div>
          </div>
        </div>
        <div class="card loading" id="card-history">
          <div class="card-title">History</div>
          <div class="card-body">
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value"></span></div>
            <div class="skeleton-row"><span class="skeleton-label"></span><span class="skeleton-value short"></span></div>
          </div>
        </div>
      </div>
      <div class="card loading" id="card-release">
        <div class="card-title">Release</div>
        <div class="card-body"><div class="skeleton-bar"></div></div>
      </div>
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

    // 상위 스튜디오 (비율 2% 이상, 최대 20개, 그외 제외)
    const studioMap = new Map<string, number>();
    for (const f of list) studioMap.set(f.studio, (studioMap.get(f.studio) || 0) + 1);
    const studioPie = this.#buildPieData(studioMap, 0.02, 20, false);

    // 상위 배우 (이름 없거나 Amateur 제외, 비율 2% 이상, 최대 20개, 그외 제외)
    const actressMap = new Map<string, number>();
    for (const f of list) {
      for (const name of f.actressList) {
        if (!name || name === 'Amateur') continue;
        actressMap.set(name, (actressMap.get(name) || 0) + 1);
      }
    }
    const actressPie = this.#buildPieData(actressMap, 0.02, 20, false);

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
    pieRow.className = 'charts-row';
    card.querySelector('.card-body')!.appendChild(pieRow);
    this.#renderPieChart(
      pieRow,
      'Rank 분포',
      rankCounts.map((cnt, i) => ({ name: `${i}`, value: cnt }))
    );
    this.#renderTreemap(pieRow, '상위 스튜디오', studioPie, (name) => popupStudio(name));
    this.#renderTreemap(pieRow, '상위 배우', actressPie, (name) => popupActress(name));

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

    // 상위 스튜디오 (비율 2% 이상, 최대 20개, 그외 제외)
    const studioMap = new Map<string, number>();
    for (const f of list) studioMap.set(f.studio, (studioMap.get(f.studio) || 0) + 1);
    const studioPie = this.#buildPieData(studioMap, 0.02, 20, false);

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
    const actressPie = this.#buildPieData(actressMap, 0.02, 20, false);

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
    pieRow.className = 'charts-row';
    card.querySelector('.card-body')!.appendChild(pieRow);
    this.#renderPieChart(
      pieRow,
      'Rank 분포',
      rankCounts.map((cnt, i) => ({ name: `${i}`, value: cnt }))
    );
    this.#renderTreemap(pieRow, '상위 스튜디오', studioPie, (name) => popupStudio(name));
    this.#renderTreemap(pieRow, '상위 배우', actressPie, (name) => popupActress(name));

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
   * Instance + Archive 합산 월별 release 분포를 ECharts 바 차트로 렌더링
   */
  #renderReleaseDist(): void {
    const card = this.querySelector('#card-release')!;
    if (card.querySelector('.echart-bar')) return;
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

    const categories: string[] = [];
    const values: number[] = [];
    for (let y = startY, m = startM; y < endY || (y === endY && m <= endM); m++) {
      if (m > 12) {
        m = 1;
        y++;
      }
      const key = `${y}.${String(m).padStart(2, '0')}`;
      categories.push(key);
      values.push(monthCounts.get(key) || 0);
    }

    // 카드 내부 렌더링
    card.classList.remove('loading');
    card.innerHTML = `
      <div class="card-title">Release <span class="release-total">${allFlays.length.toLocaleString()}건</span></div>
      <div class="echart-bar" style="width:100%;height:200px"></div>
    `;

    const textColor = getComputedStyle(this).getPropertyValue('--color-text').trim() || '#333';
    const chartEl = card.querySelector('.echart-bar') as HTMLElement;
    const chart = echarts.init(chartEl);
    this.#registerChart(chart);
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0].name}: ${params[0].value}건`, ...this.#getTooltipStyle() },
      grid: { left: 5, right: 5, top: 10, bottom: 10 },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          fontSize: 9,
          color: textColor,
          interval: (index: number) => categories[index]!.endsWith('.01'),
          formatter: (v: string) => v.substring(0, 4),
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      yAxis: { type: 'value', max: 100, show: false },
      series: [
        {
          type: 'bar',
          data: values.map((v) => ({
            value: v,
            itemStyle: v > 100 ? { color: '#e15759' } : {},
          })),
          barMaxWidth: 4,
          itemStyle: { color: '#4e79a7' },
        },
      ],
    });
  }

  // ─── 유틸리티 + ECharts ────────────────────────────────

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
   * Map 데이터를 차트용 {name, value} 배열로 변환.
   * 전체 대비 비율이 minRatio 이상인 항목만 개별 표시하고, 나머지는 "그외"로 합산.
   * @param map - 이름→건수 Map
   * @param minRatio - 개별 표시 최소 비율 (기본 2%)
   * @param maxItems - 최대 항목 수 (기본 20)
   * @returns {name, value} 배열
   */
  #buildPieData(map: Map<string, number>, minRatio = 0.02, maxItems = 20, includeRest = true): { name: string; value: number }[] {
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    let top = sorted.filter(([, v]) => v / total >= minRatio).slice(0, maxItems);
    if (top.length === 0) top = sorted.slice(0, maxItems);
    const rest = total - top.reduce((s, [, v]) => s + v, 0);
    const result = top.map(([name, value]) => ({ name, value }));
    if (includeRest && rest > 0) result.push({ name: '그외', value: rest });
    return result;
  }

  /**
   * ECharts 파이 차트 렌더링 (Rank 분포용)
   * @param container - 부모 엘리먼트
   * @param title - 차트 제목
   * @param data - {name, value} 배열
   */
  #renderPieChart(container: Element, title: string, data: { name: string; value: number }[]): void {
    if (data.length === 0) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'echart-cell';
    wrapper.innerHTML = `<div class="echart-title">${title}</div><div class="echart-container"></div>`;
    container.appendChild(wrapper);

    const chartEl = wrapper.querySelector('.echart-container') as HTMLElement;
    const chart = echarts.init(chartEl);
    this.#registerChart(chart);
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', ...this.#getTooltipStyle() },
      series: [
        {
          type: 'pie',
          radius: ['15%', '80%'],
          center: ['50%', '50%'],
          data: data.map((d) => ({
            ...d,
            label: d.value === 0 ? { show: false } : {},
          })),
          label: { show: true, position: 'inside', formatter: '{b}\n{c}', fontSize: 10, color: '#fff', textShadowBlur: 2, textShadowColor: 'rgba(0,0,0,0.5)' },
          labelLine: { show: false },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
        },
      ],
    });
  }

  /**
   * ECharts 트리맵 렌더링 (스튜디오/배우용)
   * @param container - 부모 엘리먼트
   * @param title - 차트 제목
   * @param data - {name, value} 배열
   * @param onClick - 항목 클릭 시 콜백 (name 전달)
   */
  #renderTreemap(container: Element, title: string, data: { name: string; value: number }[], onClick?: (name: string) => void): void {
    if (data.length === 0) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'echart-cell';
    wrapper.innerHTML = `<div class="echart-title">${title}</div><div class="echart-container"></div>`;
    container.appendChild(wrapper);

    const chartEl = wrapper.querySelector('.echart-container') as HTMLElement;
    const chart = echarts.init(chartEl);
    this.#registerChart(chart);
    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const total = data.reduce((s, d) => s + d.value, 0);
          const pct = ((params.value / total) * 100).toFixed(1);
          return `${params.name}: ${params.value.toLocaleString()} (${pct}%)`;
        },
        ...this.#getTooltipStyle(),
      },
      series: [
        {
          type: 'treemap',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          data,
          label: { show: true, formatter: '{b}\n{c}', fontSize: 9, color: '#fff', cursor: onClick ? 'pointer' : 'default' },
          itemStyle: { borderWidth: 1, borderColor: '#fff' },
          levels: [
            {
              itemStyle: { borderWidth: 1, borderColor: '#fff', gapWidth: 1 },
            },
          ],
        },
      ],
    });
    if (onClick) {
      chart.on('click', (params: any) => {
        if (params.name) onClick(params.name);
      });
    }
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
