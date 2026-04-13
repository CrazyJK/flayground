import FlayFetch, { type Flay } from '@lib/FlayFetch';
import { popupActress, popupFlay, popupStudio, popupTag } from '@lib/FlaySearch';
import { TreemapChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import './inc/Page';
import './page.flay-map.scss';

echarts.use([TreemapChart, TooltipComponent, CanvasRenderer]);

type TabType = 'studio' | 'actress' | 'tag' | 'flay';
type ChartItem = { name: string; value: number; flays: Flay[]; tagId?: number; opus?: string };

async function start() {
  const [flayAll, flayByScore] = await Promise.all([FlayFetch.getFlayAll(), FlayFetch.getFlayListOrderByScoreDesc()]);

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

  // ── flay별 (score 기준, 상위 500개)
  const flayData: ChartItem[] = flayByScore
    .filter((f) => f.score > 0)
    .slice(0, 50)
    .map((f) => ({ name: `${f.opus} ${f.title.length > 8 ? f.title.slice(0, 8) + '…' : f.title}`, value: f.score ** 2, flays: [f], opus: f.opus }));

  const tabData: Record<TabType, ChartItem[]> = { studio: studioData, actress: actressData, tag: tagData, flay: flayData };
  let currentTab: TabType = 'studio';

  /**
   * 트리맵 ECharts 옵션 생성 - 호출 시점의 CSS 변수를 읽어 테마 색상을 반영
   * @param data - 표시할 데이터
   */
  const buildOption = (data: ChartItem[]) => {
    const s = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute('theme') === 'dark';
    const tooltipBg = s.getPropertyValue('--color-bg').trim();
    const tooltipBorder = s.getPropertyValue('--color-border').trim();
    const tooltipText = s.getPropertyValue('--color-text').trim();
    const cellBorder = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)';
    const palette = isDark ? ['#333', '#3d3d3d', '#474747', '#515151', '#5a5a5a', '#636363', '#6e6e6e', '#777', '#555', '#444'] : ['#e8e8e8', '#d9d9d9', '#cccccc', '#bfbfbf', '#b3b3b3', '#a6a6a6', '#d0d0d0', '#c4c4c4', '#dadada', '#c8c8c8'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          // flay 탭: 개별 flay 정보 표시
          if (params.data?.opus) {
            const f: Flay = params.data.flays[0];
            return `<b>${f.opus}</b> ${f.title}<br>score: ${f.score} | ${f.studio}<br>${f.actressList.join(', ')}`;
          }
          // 나머지 탭: 집계 목록
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
      animation: false,
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
          label: { show: true, formatter: (p: any) => `${p.name}\n${p.data?.opus ? p.data.flays[0].score : p.value}`, color: isDark ? '#fff' : '#222' },
          itemStyle: { borderWidth: 1, borderColor: cellBorder },
          levels: [{ itemStyle: { borderWidth: 1, borderColor: cellBorder, gapWidth: 1 } }],
        },
      ],
    };
  };

  // ── 탭별 컨테이너 + 차트 인스턴스 생성
  const tabs: TabType[] = ['studio', 'actress', 'tag', 'flay'];
  const containers = Object.fromEntries(tabs.map((t) => [t, document.querySelector<HTMLElement>(`#treemap-${t}`)!])) as Record<TabType, HTMLElement>;
  const charts = Object.fromEntries(tabs.map((t) => [t, echarts.init(containers[t])])) as Record<TabType, echarts.ECharts>;

  // 각 차트 초기 렌더링 + 클릭 이벤트
  for (const tab of tabs) {
    charts[tab].setOption(buildOption(tabData[tab]));
    charts[tab].on('click', (params: any) => {
      if (!params.name) return;
      if (tab === 'studio') popupStudio(params.name);
      else if (tab === 'actress') popupActress(params.name);
      else if (tab === 'tag' && params.data?.tagId != null) popupTag(params.data.tagId as number);
      else if (tab === 'flay' && params.data?.opus) popupFlay(params.data.opus as string);
    });
  }

  // 테마 변경 시 모든 차트 갱신
  document.addEventListener('themeChange', () => {
    for (const tab of tabs) {
      const keyword = currentTab === tab ? searchInput.value.trim().toLowerCase() : '';
      const source = tabData[tab];
      const filtered = keyword ? source.filter((d) => d.name.toLowerCase().includes(keyword)) : source;
      charts[tab].setOption(buildOption(filtered));
    }
  });

  // 리사이즈 시 모든 차트에 전파
  window.addEventListener('resize', () => tabs.forEach((t) => charts[t].resize()));

  // ── 검색
  const searchInput = document.querySelector<HTMLInputElement>('#search')!;
  const searchKeywords: Record<TabType, string> = { studio: '', actress: '', tag: '', flay: '' };

  const updatePlaceholder = () => {
    const count = tabData[currentTab].length;
    const label = currentTab === 'studio' ? '스튜디오' : currentTab === 'actress' ? '배우' : currentTab === 'tag' ? '태그' : 'flay';
    searchInput.placeholder = `${count} ${label} 검색...`;
  };
  updatePlaceholder();

  /** 현재 탭의 차트에 검색 필터 적용 */
  const applyFilter = () => {
    const keyword = searchInput.value.trim().toLowerCase();
    searchKeywords[currentTab] = keyword;
    const source = tabData[currentTab];
    const filtered = keyword ? source.filter((d) => d.name.toLowerCase().includes(keyword)) : source;
    charts[currentTab].setOption(buildOption(filtered));
  };

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  searchInput.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilter, 200);
  });

  // ── 탭 전환 (CSS opacity 트랜지션으로 페이드 인/아웃)
  document.querySelectorAll<HTMLButtonElement>('#tabs .tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tabs .tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      // 기존 탭 페이드 아웃
      containers[currentTab].classList.remove('active');
      currentTab = btn.dataset['tab'] as TabType;
      // 새 탭 페이드 인
      containers[currentTab].classList.add('active');
      charts[currentTab].resize();
      searchInput.value = searchKeywords[currentTab];
      updatePlaceholder();
    });
  });
}

void start();
