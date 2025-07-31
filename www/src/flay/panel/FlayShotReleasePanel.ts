import FlayFetch from '@lib/FlayFetch';
import FlayMarker from '@flay/domain/FlayMarker';
import './FlayShotReleasePanel.scss';
import ApiClient from '../../lib/ApiClient';

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
        <div class="year-shot-list flex"></div>
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

      // Pack elements to minimize overlap
      this.#observer(yearShotList, yearPanel);
    });
  }

  #observer(yearShotList: HTMLDivElement, yearPanel: HTMLDivElement): void {
    // Add resize event listener for this year panel
    const resizeObserver = new ResizeObserver(() => {
      packElements(yearShotList);
    });
    resizeObserver.observe(yearPanel);

    // Also listen for window resize
    const handleResize = () => packElements(yearShotList);
    window.addEventListener('resize', handleResize);

    // Store references for cleanup
    if (!this.resizeObservers) {
      this.resizeObservers = [];
      this.resizeHandlers = [];
    }
    this.resizeObservers.push(resizeObserver);
    this.resizeHandlers.push(handleResize);
    // Pack elements to minimize overlap
    packElements(yearShotList);
  }
}

customElements.define('flay-shot-release-panel', FlayShotReleasePanel, { extends: 'div' });

/**
 * Packs elements within a container to minimize overlap and optimize layout.
 * @param {HTMLElement} container - The container element to pack.
 */
function packElements(container: HTMLElement): void {
  container.classList.remove('flex');
  const elements = Array.from(container.children) as HTMLElement[];
  if (elements.length === 0) return;

  // Reset positions
  elements.forEach((el) => {
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.top = '0';
  });

  const containerWidth = container.offsetWidth;
  const positions: { x: number; y: number; width: number; height: number }[] = [];

  elements.forEach((element, index) => {
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const offset = 10;

    let bestX = 0;
    let bestY = 0;

    if (index === 0) {
      bestX = 0;
      bestY = 0;
    } else {
      // Find the best position that doesn't overlap
      let found = false;
      for (let y = 0; y < 2000 && !found; y += offset) {
        for (let x = 0; x <= containerWidth - width && !found; x += offset) {
          const hasOverlap = positions.some((pos) => x < pos.x + pos.width && x + width > pos.x && y < pos.y + pos.height && y + height > pos.y);

          if (!hasOverlap) {
            bestX = x;
            bestY = y;
            found = true;
          }
        }
      }
    }

    element.style.left = `${bestX}px`;
    element.style.top = `${bestY}px`;

    positions.push({
      x: bestX,
      y: bestY,
      width,
      height,
    });
  });

  // Update container height
  const maxY = Math.max(...positions.map((pos) => pos.y + pos.height));
  container.style.height = `${maxY}px`;
  container.style.position = 'relative';
}
