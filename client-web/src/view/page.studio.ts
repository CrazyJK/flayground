import FlayFetch from '@lib/FlayFetch';
import { popupStudio } from '@lib/FlaySearch';
import { TreemapChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import './inc/Page';
import './page.studio.scss';

echarts.use([TreemapChart, TooltipComponent, CanvasRenderer]);

async function start() {
  const flayAll = await FlayFetch.getFlayAll();

  // studio별 flay 개수 집계
  const studioMap = new Map<string, number>();
  for (const flay of flayAll) {
    studioMap.set(flay.studio, (studioMap.get(flay.studio) || 0) + 1);
  }

  const allData = Array.from(studioMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  /**
   * 트리맵 ECharts 옵션 생성 - 호출 시점의 CSS 변수를 읽어 테마 색상을 반영
   * @param data - 표시할 스튜디오 데이터
   */
  const buildOption = (data: { name: string; value: number }[]) => {
    const s = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute('theme') === 'dark';
    const tooltipBg = s.getPropertyValue('--color-bg').trim();
    const tooltipBorder = s.getPropertyValue('--color-border').trim();
    const tooltipText = s.getPropertyValue('--color-text').trim();
    // 다크: 어두운 셀 경계, 라이트: 밝은 셀 경계
    const cellBorder = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)';

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}: ${params.value}`,
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText },
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
          label: {
            show: true,
            formatter: '{b}\n{c}',
            color: '#fff',
          },
          itemStyle: { borderWidth: 1, borderColor: cellBorder },
          levels: [{ itemStyle: { borderWidth: 1, borderColor: cellBorder, gapWidth: 1 } }],
        },
      ],
    };
  };

  const container = document.querySelector<HTMLElement>('body > map')!;
  const chart = echarts.init(container);

  chart.setOption(buildOption(allData));
  chart.on('click', (params: any) => {
    if (params.name) popupStudio(params.name);
  });

  // 테마 변경 시 현재 필터 상태로 차트 재렌더링 (buildOption이 CSS 변수를 동적으로 읽음)
  document.addEventListener('themeChange', () => applyFilter());

  window.addEventListener('resize', () => chart.resize());

  // 검색: 스튜디오 이름 필터링 후 차트 업데이트
  const searchInput = document.querySelector<HTMLInputElement>('#search')!;
  searchInput.placeholder = `${allData.length} 스튜디오 검색...`;

  const applyFilter = () => {
    const keyword = searchInput.value.trim().toLowerCase();
    const filtered = keyword ? allData.filter((d) => d.name.toLowerCase().includes(keyword)) : allData;
    chart.setOption(buildOption(filtered), true);
  };

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  searchInput.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilter, 200);
  });
}

void start();
