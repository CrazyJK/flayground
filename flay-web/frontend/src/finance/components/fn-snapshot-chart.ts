import { LineChart } from 'echarts/charts';
import { DataZoomComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { SnapshotSummary, fetchSnapshotSummaries, fmtKrw } from '../domain/financial-note';
import './fn-snapshot-chart.scss';

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface SnapshotSeriesPoint {
  date: string;
  instTotals: Map<string, number>;
}

/**
 * 스냅샷 날짜별 자산 추이 ECharts 라인 차트 커스텀 엘리먼트.
 * X축: 스냅샷 날짜, Y축: 금액(원), 시리즈: 금융기관별 + 총합계
 */
export class FnSnapshotChart extends HTMLElement {
  #chart: echarts.ECharts | null = null;
  #resizeObserver: ResizeObserver | null = null;

  /**
   * 컴포넌트 연결 시 차트 컨테이너를 구성하고 데이터를 로드한다.
   * @returns {void}
   */
  connectedCallback(): void {
    this.classList.add('fn-snapshot-chart');
    this.innerHTML = /* html */ `
      <div class="fn-chart-header">
        <span class="fn-chart-title">자산 추이</span>
        <button id="fn-chart-collapse" class="fn-btn fn-btn-xs">▲ 접기</button>
      </div>
      <div class="fn-chart-container"></div>`;

    const container = this.querySelector<HTMLElement>('.fn-chart-container')!;
    this.#chart = echarts.init(container);

    this.#resizeObserver = new ResizeObserver(() => this.#chart?.resize());
    this.#resizeObserver.observe(container);

    const collapseBtn = this.querySelector<HTMLButtonElement>('#fn-chart-collapse')!;
    collapseBtn.addEventListener('click', () => {
      const collapsed = this.classList.toggle('fn-collapsed');
      collapseBtn.textContent = collapsed ? '▼ 펼치기' : '▲ 접기';
      if (!collapsed) setTimeout(() => this.#chart?.resize(), 0);
    });

    void this.load();
  }

  /**
   * 컴포넌트 해제 시 리소스를 정리한다.
   * @returns {void}
   */
  disconnectedCallback(): void {
    this.#resizeObserver?.disconnect();
    this.#chart?.dispose();
  }

  /** 서버에서 스냅샷 요약을 로드하고 차트를 렌더링한다 */
  async load(): Promise<void> {
    const summaries = await fetchSnapshotSummaries();
    this.#renderChart(summaries);
  }

  /**
   * 날짜별 기관 합계 맵을 생성한다.
   * @param {SnapshotSummary[]} summaries 요약 목록
   * @returns {SnapshotSeriesPoint[]} 날짜별 기관 합계
   */
  #buildSeriesPoints(summaries: SnapshotSummary[]): SnapshotSeriesPoint[] {
    const dataMap = new Map<string, Map<string, number>>();
    for (const summary of summaries) {
      if (!dataMap.has(summary.date)) {
        dataMap.set(summary.date, new Map());
      }
      const instTotals = dataMap.get(summary.date)!;
      instTotals.set(summary.instName, (instTotals.get(summary.instName) ?? 0) + summary.total);
    }

    return [...dataMap.entries()].sort(([dateA], [dateB]) => dateA.localeCompare(dateB)).map(([date, instTotals]) => ({ date, instTotals }));
  }

  /**
   * 툴팁 HTML 문자열을 생성한다.
   * @param {Array<{ axisValue?: string; marker?: string; seriesName?: string; value?: number | null }>} params 툴팁 파라미터
   * @returns {string} 렌더링할 HTML 문자열
   */
  #buildTooltipHtml(params: Array<{ axisValue?: string; marker?: string; seriesName?: string; value?: number | null }>): string {
    const date = params[0]?.axisValue ?? '';
    const lines = params
      .filter((param) => param.value !== null && param.value !== undefined)
      .map(
        (param) => `
              <tr>
                <td>${param.marker ?? ''}${param.seriesName ?? ''}</td>
                <td style="text-align:right"><strong>${fmtKrw(param.value as number)}</strong></td>
              </tr>`
      )
      .join('');
    return `
            <table style="font-size:12px; background:var(--color-bg-elevated); color:var(--color-text); border:1px solid var(--color-border-window); padding:4px 8px; border-radius:4px;">
              <thead>
                <tr>
                  <th colspan="2"><strong>${date}</strong></th>
                </tr>
              </thead>
              <tbody>
                ${lines}
              </tbody>
            </table>`;
  }

  /**
   * 스냅샷 요약 데이터를 차트 옵션으로 변환해 렌더링한다.
   * @param {SnapshotSummary[]} summaries 스냅샷 요약 목록
   * @returns {void}
   */
  #renderChart(summaries: SnapshotSummary[]): void {
    if (!this.#chart) return;

    const points = this.#buildSeriesPoints(summaries);
    const dates = points.map((point) => point.date);
    const instNames = [...new Set(summaries.map((s) => s.instName))];

    // 총합계 시리즈
    const totalSeries: (number | null)[] = points.map((point) => [...point.instTotals.values()].reduce((sum, value) => sum + value, 0));

    // 기관별 시리즈
    const instSeriesList = instNames.map((name) => ({
      name,
      type: 'line' as const,
      data: points.map((point) => point.instTotals.get(name) ?? 0),
      connectNulls: true,
      lineStyle: { width: 1.5 },
      symbolSize: 4,
    }));

    const series: echarts.EChartsCoreOption['series'] = [
      {
        name: '총합계',
        type: 'line' as const,
        data: totalSeries,
        connectNulls: true,
        lineStyle: { width: 3, type: 'solid' as const },
        symbolSize: 6,
        z: 10,
      },
      ...instSeriesList,
    ];

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const rows = Array.isArray(params) ? (params as Array<{ axisValue?: string; marker?: string; seriesName?: string; value?: number | null }>) : [];
          return this.#buildTooltipHtml(rows);
        },
      },
      legend: {
        type: 'scroll',
        bottom: 40,
        textStyle: { fontSize: 11 },
      },
      grid: { top: 10, left: 10, right: 20, bottom: 80, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 0,
          fontSize: 10,
          formatter: (val: string) => val.slice(0, 7), // YYYY-MM
        },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { show: false }, // 내부 격자선 숨기기
        axisLabel: {
          fontSize: 10,
          formatter: (val: number) => {
            if (Math.abs(val) >= 1_0000_0000) return `${(val / 1_0000_0000).toFixed(0)}억`;
            if (Math.abs(val) >= 1_0000) return `${(val / 1_0000).toFixed(0)}만`;
            return String(val);
          },
        },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', bottom: 0, height: 20 },
      ],
      series,
    };

    this.#chart.setOption(option, true);
    requestAnimationFrame(() => this.#chart?.resize());
  }
}

customElements.define('fn-snapshot-chart', FnSnapshotChart);
