import FlayDiv from '@base/FlayDiv';
import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch from '@lib/FlayFetch';
import PackUtils, { PackOptions } from '@lib/PackUtils';
import './FlayShotReleasePanel.scss';

export class FlayShotReleasePanel extends FlayDiv {
  resizeObservers: ResizeObserver[] = [];
  resizeHandlers: (() => void)[] = [];

  constructor() {
    super();
    this.classList.add('flay-shot-release-panel');
  }

  connectedCallback() {
    void this.showRelease();
  }

  disconnectedCallback() {
    // Cleanup if necessary
    this.resizeObservers.forEach((observer) => observer.disconnect());
    this.resizeHandlers.forEach((handler) => window.removeEventListener('resize', handler));
  }

  async showRelease(): Promise<void> {
    const allFlaysList = await FlayFetch.getFlayAll();

    // release를 년도별로 그룹화
    const releaseByYear = allFlaysList.reduce(
      (acc, flay) => {
        const shotCount = flay.video.likes?.length || 0;
        if (shotCount < 1) return acc;

        const year = new Date(flay.release).getFullYear();
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push(flay);
        return acc;
      },
      {} as Record<number, typeof allFlaysList>
    );
    // 연도 역순 정렬
    const sortedYears = Object.keys(releaseByYear).sort((a, b) => parseInt(b) - parseInt(a));

    const packOptions: Partial<PackOptions> = { strategy: 'topLeft' };
    const packUtils = new PackUtils(packOptions);

    // 년도별로 패널 생성
    for (const year of sortedYears) {
      const yearPanel = document.createElement('div');
      yearPanel.id = `year-${year}`;
      yearPanel.classList.add('year-panel');
      yearPanel.innerHTML = `
        <h3>${year}</h3>
        <div class="year-shot-list" id="year-shot-list-${year}"></div>
      `;
      const yearShotList = yearPanel.querySelector('.year-shot-list') as HTMLDivElement;

      const flayList = releaseByYear[parseInt(year)] as typeof allFlaysList;

      flayList
        .sort((a, b) => a.release.localeCompare(b.release))
        .forEach((flay) => {
          const shotCount = flay.video.likes?.length || 0;
          const markerSize = (shotCount * 2 || 1) * 20;
          const flayMarker = new FlayMarker(flay, { shape: 'square', cover: true });
          flayMarker.style.width = `${markerSize}px`;
          flayMarker.classList.remove('shot');
          yearShotList.appendChild(flayMarker);
        });

      this.appendChild(yearPanel);

      await packUtils.pack(yearShotList);
    }
  }
}

customElements.define('flay-shot-release-panel', FlayShotReleasePanel);
