import { LineChart } from 'echarts/charts';
import { DataZoomComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { SnapshotSummary, fetchSnapshotSummaries, fmtKrw } from '../domain/financial-note';

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

/**
 * 스냅샷 날짜별 자산 추이 ECharts 라인 차트 커스텀 엘리먼트.
 * X축: 스냅샷 날짜, Y축: 금액(원), 시리즈: 금융기관별 + 총합계
 */
export class FnSnapshotChart extends HTMLElement {
  #chart: echarts.ECharts | null = null;
  #resizeObserver: ResizeObserver | null = null;
  #chartMode: 'normal' | 'stacked' = 'normal';
  #lastSummaries: SnapshotSummary[] = [];

  connectedCallback(): void {
    this.classList.add('fn-snapshot-chart');
    this.innerHTML = /* html */ `
      <div class="fn-chart-header">
        <span class="fn-chart-title">자산 추이</span>
        <button id="fn-chart-mode-normal" class="fn-btn fn-btn-xs fn-chart-mode-btn fn-chart-mode-active">꺽은선</button>
        <button id="fn-chart-mode-stacked" class="fn-btn fn-btn-xs fn-chart-mode-btn">누적 꺽은선</button>
        <button id="fn-chart-collapse" class="fn-btn fn-btn-xs">▲ 접기</button>
      </div>
      <div class="fn-chart-container"></div>`;

    const container = this.querySelector<HTMLElement>('.fn-chart-container')!;
    this.#chart = echarts.init(container);

    this.#resizeObserver = new ResizeObserver(() => this.#chart?.resize());
    this.#resizeObserver.observe(container);

    // 차트 모드 토글
    this.querySelector('#fn-chart-mode-normal')?.addEventListener('click', () => {
      this.#chartMode = 'normal';
      this.querySelector('#fn-chart-mode-normal')?.classList.add('fn-chart-mode-active');
      this.querySelector('#fn-chart-mode-stacked')?.classList.remove('fn-chart-mode-active');
      this.#renderChart(this.#lastSummaries);
    });
    this.querySelector('#fn-chart-mode-stacked')?.addEventListener('click', () => {
      this.#chartMode = 'stacked';
      this.querySelector('#fn-chart-mode-stacked')?.classList.add('fn-chart-mode-active');
      this.querySelector('#fn-chart-mode-normal')?.classList.remove('fn-chart-mode-active');
      this.#renderChart(this.#lastSummaries);
    });

    const collapseBtn = this.querySelector<HTMLButtonElement>('#fn-chart-collapse')!;
    collapseBtn.addEventListener('click', () => {
      const collapsed = this.classList.toggle('fn-collapsed');
      collapseBtn.textContent = collapsed ? '▼ 펼치기' : '▲ 접기';
      if (!collapsed) setTimeout(() => this.#chart?.resize(), 0);
    });

    void this.load();
  }

  disconnectedCallback(): void {
    this.#resizeObserver?.disconnect();
    this.#chart?.dispose();
  }

  /** 서버에서 스냅샷 요약을 로드하고 차트를 렌더링한다 */
  async load(): Promise<void> {
    const summaries = await fetchSnapshotSummaries();
    this.#lastSummaries = summaries;
    this.#renderChart(summaries);
  }

  #renderChart(summaries: SnapshotSummary[]): void {
    if (!this.#chart) return;

    // 날짜 목록 (정렬)
    const dates = [...new Set(summaries.map((s) => s.date))].sort();
    // 기관명 목록
    const instNames = [...new Set(summaries.map((s) => s.instName))];

    // 날짜 → 기관별 합계 매핑
    const dataMap = new Map<string, Map<string, number>>();
    for (const s of summaries) {
      if (!dataMap.has(s.date)) dataMap.set(s.date, new Map());
      dataMap.get(s.date)!.set(s.instName, (dataMap.get(s.date)!.get(s.instName) ?? 0) + s.total);
    }

    // 총합계 시리즈
    const totalSeries: (number | null)[] = dates.map((d) => {
      const m = dataMap.get(d);
      if (!m) return 0;
      return [...m.values()].reduce((a, b) => a + b, 0);
    });

    // 기관별 시리즈
    const isStacked = this.#chartMode === 'stacked';
    const instSeriesList = instNames.map((name) => ({
      name,
      type: 'line' as const,
      stack: isStacked ? 'total' : undefined,
      areaStyle: isStacked ? { opacity: 0.3 } : undefined,
      data: dates.map((d) => dataMap.get(d)?.get(name) ?? 0),
      connectNulls: true,
      lineStyle: { width: 1.5 },
      symbolSize: 4,
    }));

    const series: echarts.EChartsCoreOption['series'] = isStacked
      ? instSeriesList // 누적 모드: 총합계 숨김 (스택 높이가 총합계)
      : [
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
        formatter: (params: any) => {
          const date = params[0]?.axisValue ?? '';
          const lines = params
            .filter((p: any) => p.value !== null)
            .map((p: any) => `<div>${p.marker}${p.seriesName}: <strong>${fmtKrw(p.value)}</strong></div>`)
            .join('');
          return `<div style="font-size:12px"><strong>${date}</strong>${lines}</div>`;
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
          rotate: 30,
          fontSize: 10,
          formatter: (val: string) => val.slice(0, 7), // YYYY-MM
        },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
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
