import ApiClient from '@lib/ApiClient';
import FlayFetch, { type Flay } from '@lib/FlayFetch';
import { popupActress, popupFlay, popupStudio, popupTag } from '@lib/FlaySearch';
import { packEnclose, packSiblings } from 'd3-hierarchy';
import { GraphChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import './inc/Page';
import './page.flay-map.scss';

echarts.use([GraphChart, TooltipComponent, CanvasRenderer]);

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
    .slice(0, 100)
    .map((f) => ({ name: `${f.opus} ${f.title.length > 8 ? f.title.slice(0, 8) + '…' : f.title}`, value: f.score ** 3, flays: [f], opus: f.opus }));

  const tabData: Record<TabType, ChartItem[]> = { studio: studioData, actress: actressData, tag: tagData, flay: flayData };
  let currentTab: TabType = 'studio';

  // ── flay 커버 이미지를 원형으로 크롭한 data URL 생성
  const circularCovers = new Map<string, string>();
  await Promise.all(
    flayData
      .filter((d) => d.opus)
      .map(
        (d) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const s = 200;
              const canvas = document.createElement('canvas');
              canvas.width = s;
              canvas.height = s;
              const ctx = canvas.getContext('2d')!;
              ctx.beginPath();
              ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
              ctx.clip();
              // center crop (object-fit: cover 방식)
              const min = Math.min(img.width, img.height);
              const sx = (img.width - min) / 2;
              const sy = (img.height - min) / 2;
              ctx.drawImage(img, sx, sy, min, min, 0, 0, s, s);
              circularCovers.set(d.opus!, canvas.toDataURL('image/png'));
              resolve();
            };
            img.onerror = () => resolve();
            img.src = ApiClient.buildUrl(`/static/cover/${d.opus}`);
          })
      )
  );

  /**
   * Packed Bubble 옵션 생성 - d3 circle packing + ECharts graph 렌더링
   * @param data - 표시할 데이터
   * @param container - 차트 컨테이너 (크기 참조)
   * @param tab - 탭 타입 (툴팁 분기용)
   */
  const buildBubbleOption = (data: ChartItem[], container: HTMLElement, tab: TabType) => {
    const s = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute('theme') === 'dark';
    const tooltipBg = s.getPropertyValue('--color-bg').trim();
    const tooltipBorder = s.getPropertyValue('--color-border').trim();
    const tooltipText = s.getPropertyValue('--color-text').trim();
    const palette = isDark ? ['#444', '#4a4a4a', '#555', '#5a5a5a', '#666', '#6e6e6e', '#777', '#808080'] : ['#d9d9d9', '#cccccc', '#bfbfbf', '#b3b3b3', '#a6a6a6', '#c4c4c4', '#d0d0d0', '#c8c8c8'];

    // d3 packSiblings로 형제 원 패킹 계산 (간격 확보를 위해 반지름에 padding 추가)
    const w = container.clientWidth;
    const h = container.clientHeight;
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const padding = 3;
    const circles = data.map((d, i) => ({ ...d, r: 10 + Math.sqrt(d.value / maxVal) * 80 + padding, _i: i, _origR: 10 + Math.sqrt(d.value / maxVal) * 80 }));
    packSiblings(circles as any);

    // 패킹 결과의 바운딩 원 → 뷰포트에 맞게 스케일링
    const enclosing = packEnclose(circles as any);
    const scale = (Math.min(w, h) / (enclosing.r * 2)) * 0.92;
    const cx = w / 2;
    const cy = h / 2;

    const nodes = circles.map((c: any, i: number) => {
      const d = data[c._i]!;
      const size = c._origR * 2 * scale;
      const isFlay = tab === 'flay' && d.opus;
      return {
        ...d,
        id: String(i),
        x: cx + c.x * scale,
        y: cy + c.y * scale,
        symbolSize: size,
        symbol: isFlay && circularCovers.has(d.opus!) ? `image://${circularCovers.get(d.opus!)}` : 'circle',
        itemStyle: isFlay ? { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', borderWidth: 1 } : { color: palette[i % palette.length], borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', borderWidth: 1 },
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          // flay 탭: 커버 이미지 + 오버레이 정보
          if (tab === 'flay' && params.data?.opus) {
            const f: Flay = params.data.flays[0];
            const coverUrl = ApiClient.buildUrl(`/static/cover/${f.opus}`);
            const tw = 400;
            const th = 269;
            return (
              `<div style="position:relative;width:${tw}px;height:${th}px;overflow:hidden">` +
              `<img src="${coverUrl}" style="display:block;width:100%;height:100%;object-fit:cover" />` +
              `<div style="position:absolute;bottom:0;left:0;right:0;padding:24px 8px 8px;background:linear-gradient(transparent,rgba(0,0,0,0.85));color:#fff;line-height:1.4;word-break:break-all;overflow-wrap:break-word">` +
              `<div style="font-weight:bold;font-size:14px">${f.opus} ${f.title}</div>` +
              `<div style="font-size:12px;opacity:0.85;margin-top:2px">${f.studio} · ${f.actressList.join(', ')} · ${f.release}</div>` +
              `</div></div>`
            );
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
          return `<div style="padding:8px"><b>${params.data?.name}: ${params.data?.value}</b><table style="border-collapse:collapse;margin-top:4px">${rows.join('')}${more}</table></div>`;
        },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText },
        padding: 0,
      },
      animation: true,
      animationDuration: 800,
      animationEasingUpdate: 'quinticInOut' as const,
      stateAnimation: { duration: 300, easing: 'cubicOut' as const },
      series: [
        {
          type: 'graph',
          layout: 'none',
          roam: true,
          data: nodes,
          links: [] as any[],
          label: {
            show: true,
            position: 'inside',
            formatter: (p: any) => {
              if (tab === 'flay' && p.data?.opus) return `${p.data.opus}`;
              return `${p.data.name}\n${p.data.value}`;
            },
            fontSize: 10,
            color: isDark ? '#fff' : '#222',
          },
          emphasis: { focus: 'self', blurScope: 'global', label: { fontSize: 13, fontWeight: 'bold' }, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
          blur: { itemStyle: { opacity: 0.15 }, label: { opacity: 0.15 } },
          labelLayout: { hideOverlap: true },
        },
      ],
    };
  };

  /** 탭 타입에 따라 적절한 옵션 빌더 선택 */
  const buildOption = (tab: TabType, data: ChartItem[]) => buildBubbleOption(data, containers[tab], tab);

  // ── 탭별 컨테이너 + 차트 인스턴스 생성
  const tabs: TabType[] = ['studio', 'actress', 'tag', 'flay'];
  const containers = Object.fromEntries(tabs.map((t) => [t, document.querySelector<HTMLElement>(`#treemap-${t}`)!])) as Record<TabType, HTMLElement>;
  const charts = Object.fromEntries(tabs.map((t) => [t, echarts.init(containers[t])])) as Record<TabType, echarts.ECharts>;

  // 각 차트 초기 렌더링 + 클릭 이벤트
  for (const tab of tabs) {
    charts[tab].setOption(buildOption(tab, tabData[tab]), { notMerge: true });
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
      charts[tab].setOption(buildOption(tab, filtered), { notMerge: true });
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
    searchInput.placeholder = currentTab === 'flay' ? `상위 ${count}개 검색...` : `${count} ${label} 검색...`;
  };
  updatePlaceholder();

  /** 현재 탭의 차트에 검색 필터 적용 */
  const applyFilter = () => {
    const keyword = searchInput.value.trim().toLowerCase();
    searchKeywords[currentTab] = keyword;
    const source = tabData[currentTab];
    const filtered = keyword ? source.filter((d) => d.name.toLowerCase().includes(keyword)) : source;
    charts[currentTab].setOption(buildOption(currentTab, filtered), { notMerge: true });
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
