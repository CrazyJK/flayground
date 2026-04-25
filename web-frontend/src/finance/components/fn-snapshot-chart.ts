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

  connectedCallback(): void {
    this.classList.add('fn-snapshot-chart');
    this.innerHTML = /* html */ `
      <div class="fn-chart-header">
        <span class="fn-chart-title">자산 추이</span>
        <button id="fn-chart-refresh" class="fn-btn">새로고침</button>
      </div>
      <div class="fn-chart-container" style="width:100%;height:400px;"></div>`;

    const container = this.querySelector<HTMLElement>('.fn-chart-container')!;
    this.#chart = echarts.init(container);

    this.#resizeObserver = new ResizeObserver(() => this.#chart?.resize());
    this.#resizeObserver.observe(container);

    this.querySelector('#fn-chart-refresh')?.addEventListener('click', () => this.load());
    this.load();
  }

  disconnectedCallback(): void {
    this.#resizeObserver?.disconnect();
    this.#chart?.dispose();
  }

  /** 서버에서 스냅샷 요약을 로드하고 차트를 렌더링한다 */
  async load(): Promise<void> {
    const summaries = await fetchSnapshotSummaries();
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
      if (!m) return null;
      return [...m.values()].reduce((a, b) => a + b, 0);
    });

    // 기관별 시리즈
    const instSeriesList = instNames.map((name) => ({
      name,
      type: 'line' as const,
      data: dates.map((d) => dataMap.get(d)?.get(name) ?? null),
      connectNulls: true,
      lineStyle: { width: 1.5 },
      symbolSize: 4,
    }));

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
      series: [
        {
          name: '총합계',
          type: 'line',
          data: totalSeries,
          connectNulls: true,
          lineStyle: { width: 3, type: 'solid' },
          symbolSize: 6,
          z: 10,
        },
        ...instSeriesList,
      ],
    };

    this.#chart.setOption(option, true);
    requestAnimationFrame(() => this.#chart?.resize());
  }
}

customElements.define('fn-snapshot-chart', FnSnapshotChart);
