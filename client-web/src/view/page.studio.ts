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

  // studio별 flay 목록 집계
  const studioMap = new Map<string, typeof flayAll>();
  for (const flay of flayAll) {
    if (!studioMap.has(flay.studio)) studioMap.set(flay.studio, []);
    studioMap.get(flay.studio)!.push(flay);
  }

  const allData = Array.from(studioMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, flays]) => ({ name, value: flays.length, flays }));

  /**
   * 트리맵 ECharts 옵션 생성 - 호출 시점의 CSS 변수를 읽어 테마 색상을 반영
   * @param data - 표시할 스튜디오 데이터
   */
  const buildOption = (data: { name: string; value: number; flays: typeof flayAll }[]) => {
    const s = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute('theme') === 'dark';
    const tooltipBg = s.getPropertyValue('--color-bg').trim();
    const tooltipBorder = s.getPropertyValue('--color-border').trim();
    const tooltipText = s.getPropertyValue('--color-text').trim();
    const cellBorder = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)';
    // 다크: 어두운 무채색(20~55%) / 라이트: 밝은 무채색(55~90%)
    const palette = isDark ? ['#333', '#3d3d3d', '#474747', '#515151', '#5a5a5a', '#636363', '#6e6e6e', '#777', '#555', '#444'] : ['#e8e8e8', '#d9d9d9', '#cccccc', '#bfbfbf', '#b3b3b3', '#a6a6a6', '#d0d0d0', '#c4c4c4', '#dadada', '#c8c8c8'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const flays: typeof flayAll = params.data?.flays ?? [];
          const cell = (f: (typeof flayAll)[number]) => `<td style="padding-right:1em;font-family:monospace;white-space:nowrap">${f.opus}&nbsp;${f.title.length > 10 ? f.title.slice(0, 10) + '…' : f.title}</td>`;
          const rows: string[] = [];
          for (let i = 0; i < Math.min(flays.length, 20); i += 2) {
            const right = flays[i + 1] ? cell(flays[i + 1]!) : '<td></td>';
            rows.push(`<tr>${cell(flays[i]!)}${right}</tr>`);
          }
          const more = flays.length > 20 ? `<tr><td colspan="2"><i>...외 ${flays.length - 20}개</i></td></tr>` : '';
          return `<b>${params.name}: ${params.value}</b><table style="border-collapse:collapse;margin-top:4px">${rows.join('')}${more}</table>`;
        },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText },
      },
      color: palette,
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
            color: isDark ? '#fff' : '#222',
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
