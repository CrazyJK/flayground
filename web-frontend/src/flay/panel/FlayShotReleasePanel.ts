import GroundFlay from '@base/GroundFlay';
import FlayMarker from '@flay/domain/FlayMarker';
import PackUtils, { PackOptions } from '@lib/media/PackUtils';
import FlayFetch from '@lib/services/FlayFetch';
import './FlayShotReleasePanel.scss';

/** 마커 한 칸당 픽셀 단위 */
const UNIT_PX = 20;
/** 마커 최대 배율 (샷 수가 너무 많을 경우 상한) */
const MAX_MULTIPLIER = 8;

/**
 * 출시연도(release year)별로 샷이 있는 Flay들을 시각화하는 패널.
 *
 * 구성:
 * - 상단 Stats: 전체 샷 수 / 활동 연도 수 / 최다 연도
 * - 상단 Year Nav: 연도 칩을 누르면 해당 섹션으로 스크롤
 * - 본문 Year Sections: 좌측 큰 연도 라벨 + 샷 수 게이지, 우측 PackUtils로 패킹된 마커들
 */
export class FlayShotReleasePanel extends GroundFlay {
  /** 등록된 PackUtils 인스턴스 (resize 정리용) */
  #packUtilsList: PackUtils[] = [];

  constructor() {
    super();
    this.classList.add('flay-shot-release-panel');
  }

  /** 컴포넌트가 DOM에 연결될 때 데이터 로드 및 렌더를 시작한다. */
  connectedCallback() {
    void this.#bootstrap();
  }

  /** 컴포넌트가 DOM에서 분리될 때 resize 핸들러 등 리소스를 해제한다. */
  disconnectedCallback() {
    this.#packUtilsList.forEach((p) => p.release());
    this.#packUtilsList = [];
  }

  /** 데이터 로드 → 통계/네비/섹션 렌더 → 각 섹션 패킹 */
  async #bootstrap(): Promise<void> {
    const allFlaysList = await FlayFetch.getFlayAll();

    // 1) 연도별 그룹화 (샷이 있는 것만)
    const releaseByYear = allFlaysList.reduce<Record<number, typeof allFlaysList>>((acc, flay) => {
      const shotCount = flay.video.likes?.length ?? 0;
      if (shotCount < 1) return acc;
      const year = new Date(flay.release).getFullYear();
      if (Number.isNaN(year)) return acc;
      (acc[year] ??= []).push(flay);
      return acc;
    }, {});

    // 2) 연도별 통계
    const yearStats = Object.entries(releaseByYear)
      .map(([year, list]) => {
        const flayCount = list.length;
        const shotSum = list.reduce((sum, f) => sum + (f.video.likes?.length ?? 0), 0);
        return { year: parseInt(year), flayCount, shotSum };
      })
      .sort((a, b) => b.year - a.year);

    const totalShots = yearStats.reduce((sum, s) => sum + s.shotSum, 0);
    const totalFlays = yearStats.reduce((sum, s) => sum + s.flayCount, 0);
    const peak = yearStats.reduce<{ year: number; shotSum: number }>((best, s) => (s.shotSum > best.shotSum ? { year: s.year, shotSum: s.shotSum } : best), { year: 0, shotSum: 0 });
    const maxYearShot = peak.shotSum || 1;

    // 3) Hero (통계 + 연도 네비)
    const hero = document.createElement('section');
    hero.classList.add('release-hero');
    hero.innerHTML = `
      <div class="hero-title">
        <h3>Shot Constellation</h3>
        <p>출시 연도별 샷의 별자리 — 마커 크기는 좋아요 수에 비례</p>
      </div>
      <div class="hero-stats">
        <div class="stat"><b>${totalShots.toLocaleString()}</b><span>총 샷</span></div>
        <div class="stat"><b>${totalFlays.toLocaleString()}</b><span>샷한 작품</span></div>
        <div class="stat"><b>${yearStats.length}</b><span>활동 연도</span></div>
        <div class="stat"><b>${peak.year || '-'}</b><span>최다 연도(${peak.shotSum})</span></div>
      </div>
      <nav class="year-nav" aria-label="연도 점프">
        ${yearStats
          .map(
            (s) => `
            <button type="button" class="year-chip" data-year="${s.year}" title="${s.year}년 · ${s.flayCount}작품 · ${s.shotSum}샷">
              <span class="y">${s.year}</span>
              <span class="c">${s.shotSum}</span>
            </button>`
          )
          .join('')}
      </nav>
    `;
    this.appendChild(hero);

    hero.querySelector('.year-nav')?.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.year-chip') as HTMLButtonElement;
      if (!target) return;
      const y = target.dataset.year;
      this.querySelector(`#year-${y}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // 4) 연도별 섹션 + 패킹 (PackUtils 사용 유지)
    const packOptions: Partial<PackOptions> = { strategy: 'topLeft', gap: 2 };

    for (const stat of yearStats) {
      const flayList = releaseByYear[stat.year] ?? [];
      const ratio = Math.round((stat.shotSum / maxYearShot) * 100);

      const section = document.createElement('section');
      section.id = `year-${stat.year}`;
      section.classList.add('year-section');
      section.innerHTML = `
        <aside class="year-aside">
          <div class="year-badge">${stat.year}</div>
          <div class="year-meta">
            <span class="m-flay">${stat.flayCount} 작품</span>
            <span class="m-shot">${stat.shotSum} 샷</span>
            <span class="m-bar" title="최다 연도 대비 ${ratio}%"><i style="width:${ratio}%"></i></span>
          </div>
        </aside>
        <div class="year-canvas">
          <div class="year-shot-list" id="year-shot-list-${stat.year}"></div>
        </div>
      `;
      const yearShotList = section.querySelector('.year-shot-list') as HTMLDivElement;

      flayList
        .sort((a, b) => a.release.localeCompare(b.release))
        .forEach((flay) => {
          const shotCount = flay.video.likes?.length ?? 0;
          const multiplier = Math.min(shotCount * 2, MAX_MULTIPLIER);
          const markerSize = (multiplier || 1) * UNIT_PX;
          const flayMarker = new FlayMarker(flay, { shape: FlayMarker.SHAPE.SQUARE, cover: true });
          flayMarker.style.width = `${markerSize}px`;
          flayMarker.classList.remove('shot');
          yearShotList.appendChild(flayMarker);
        });

      this.appendChild(section);

      const packUtils = new PackUtils(packOptions);
      this.#packUtilsList.push(packUtils);
      await packUtils.pack(yearShotList);
    }
  }
}

customElements.define('flay-shot-release-panel', FlayShotReleasePanel);
