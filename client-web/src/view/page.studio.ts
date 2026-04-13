import FlayFetch, { type Flay } from '@lib/FlayFetch';
import { popupActress, popupStudio, popupTag } from '@lib/FlaySearch';
import { TreemapChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import './inc/Page';
import './page.studio.scss';

echarts.use([TreemapChart, TooltipComponent, CanvasRenderer]);

type TabType = 'studio' | 'actress' | 'tag';
type ChartItem = { name: string; value: number; flays: Flay[]; tagId?: number };

async function start() {
  const flayAll = await FlayFetch.getFlayAll();

  // ── 스튜디오별 집계
  const studioMap = new Map<string, Flay[]>();
  for (const flay of flayAll) {
    if (!studioMap.has(flay.studio)) studioMap.set(flay.studio, []);
    studioMap.get(flay.studio)!.push(flay);
  }
  const studioData: ChartItem[] = Array.from(studioMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, flays]) => ({ name, value: flays.length, flays }));

  // ── 배우별 집계
  const actressMap = new Map<string, Flay[]>();
  for (const flay of flayAll) {
    for (const name of flay.actressList) {
      if (!name || name === 'Amateur') continue;
      if (!actressMap.has(name)) actressMap.set(name, []);
      actressMap.get(name)!.push(flay);
    }
  }
  const actressData: ChartItem[] = Array.from(actressMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, flays]) => ({ name, value: flays.length, flays }));

  // ── 태그별 집계
  const tagMap = new Map<number, { name: string; flays: Flay[] }>();
  for (const flay of flayAll) {
    for (const tag of flay.video.tags) {
      if (!tagMap.has(tag.id)) tagMap.set(tag.id, { name: tag.name, flays: [] });
      tagMap.get(tag.id)!.flays.push(flay);
    }
  }
  const tagData: ChartItem[] = Array.from(tagMap.entries())
    .sort((a, b) => b[1].flays.length - a[1].flays.length)
    .map(([tagId, { name, flays }]) => ({ name, value: flays.length, flays, tagId }));

  const tabData: Record<TabType, ChartItem[]> = { studio: studioData, actress: actressData, tag: tagData };
  let currentTab: TabType = 'studio';

  /**
   * 트리맵 ECharts 옵션 생성 - 호출 시점의 CSS 변수를 읽어 테마 색상을 반영
   * @param data - 표시할 스튜디오 데이터
   */
  const buildOption = (data: ChartItem[]) => {
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
          const flays: Flay[] = params.data?.flays ?? [];
          const cell = (f: Flay) => `<td style="padding-right:1em;font-family:monospace;white-space:nowrap">${f.opus}&nbsp;${f.title.length > 10 ? f.title.slice(0, 10) + '…' : f.title}</td>`;
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

  chart.setOption(buildOption(studioData));
  chart.on('click', (params: any) => {
    if (!params.name) return;
    if (currentTab === 'studio') popupStudio(params.name);
    else if (currentTab === 'actress') popupActress(params.name);
    else if (currentTab === 'tag' && params.data?.tagId != null) popupTag(params.data.tagId as number);
  });

  document.addEventListener('themeChange', () => applyFilter());
  window.addEventListener('resize', () => chart.resize());

  // ── 검색
  const searchInput = document.querySelector<HTMLInputElement>('#search')!;

  const updatePlaceholder = () => {
    const count = tabData[currentTab].length;
    const label = currentTab === 'studio' ? '스튜디오' : currentTab === 'actress' ? '배우' : '태그';
    searchInput.placeholder = `${count} ${label} 검색...`;
  };
  updatePlaceholder();

  const applyFilter = () => {
    const keyword = searchInput.value.trim().toLowerCase();
    const source = tabData[currentTab];
    const filtered = keyword ? source.filter((d) => d.name.toLowerCase().includes(keyword)) : source;
    chart.setOption(buildOption(filtered), true);
  };

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  searchInput.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilter, 200);
  });

  // ── 탭 전환
  document.querySelectorAll<HTMLButtonElement>('#tabs .tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tabs .tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset['tab'] as TabType;
      searchInput.value = '';
      updatePlaceholder();
      applyFilter();
    });
  });
}

void start();
