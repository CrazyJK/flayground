import FlayFetch from '@lib/FlayFetch';
import FlayMarker from '@flay/domain/FlayMarker';
import ApiClient from '@lib/ApiClient';
import PackUtils, { PackOptions } from '@lib/PackUtils';
import './FlayShotReleasePanel.scss';

export class FlayShotReleasePanel extends HTMLDivElement {
  resizeObservers: ResizeObserver[] = [];
  resizeHandlers: (() => void)[] = [];

  constructor() {
    super();
    this.classList.add('flay-shot-release-panel');
  }

  connectedCallback() {
    this.showRelease();
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

    // 년도별로 패널 생성
    sortedYears.forEach((year) => {
      const yearPanel = document.createElement('div');
      yearPanel.id = `year-${year}`;
      yearPanel.classList.add('year-panel');
      yearPanel.innerHTML = `
        <h3>${year}</h3>
        <div class="year-shot-list"></div>
      `;
      const yearShotList = yearPanel.querySelector('.year-shot-list') as HTMLDivElement;

      const flayList = releaseByYear[year] as typeof allFlaysList;

      flayList
        .sort((a, b) => a.release.localeCompare(b.release))
        .forEach((flay) => {
          const markerSize = (flay.video.likes?.length * 2 || 1) * 20;
          const flayMarker = new FlayMarker(flay);
          flayMarker.style.width = `${markerSize}px`;
          if (flay.video.likes?.length >= 2) {
            flayMarker.style.backgroundImage = `url(${ApiClient.buildUrl(`/static/cover/${flay.opus}`)})`;
            flayMarker.classList.remove('shot');
          }
          yearShotList.appendChild(flayMarker);
        });

      this.appendChild(yearPanel);

      const packOptions: Partial<PackOptions> = { strategy: 'bottomLeft' };
      const packUtils = new PackUtils(packOptions);
      packUtils.pack(yearShotList);
    });
  }
}

customElements.define('flay-shot-release-panel', FlayShotReleasePanel, { extends: 'div' });
