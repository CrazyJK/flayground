import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import PackUtils, { PackStrategies, PackStrategy } from '@lib/PackUtils';
import RandomUtils from '@lib/RandomUtils';
import './FlayPackPanel.scss';

export class FlayPackPanel extends HTMLElement {
  #packUtils: PackUtils;
  #strategy: PackStrategy; // 패널의 배치 전략
  #animate: boolean; // 애니메이션 여부

  constructor(strategy: PackStrategy = RandomUtils.getRandomElementFromArray(PackStrategies), animate: boolean = true) {
    super();
    this.classList.add('flay-pack-panel');
    this.#strategy = strategy;
    this.#animate = animate;
  }

  connectedCallback() {
    this.#packUtils = new PackUtils({ strategy: this.#strategy, fixedContainer: true, animate: this.#animate });
    this.#initializePanel();
  }

  disconnectedCallback() {
    this.#packUtils.release();
  }

  #initializePanel(): void {
    this.#packContent();
  }

  async #packContent(): Promise<void> {
    const flayList = await FlayFetch.getFlayAll();

    const totalShotSquared = flayList.reduce((acc, flay) => acc + ((flay.video.likes?.length || 0) + 1) ** 2, 0);
    const areaPercentage = this.#strategy === 'circle' ? 0.3 : 0.7; // 사용할 영역을 사용
    const areaMultiplier = Math.round(Math.sqrt((window.innerWidth * window.innerHeight * areaPercentage) / totalShotSquared));
    const fieldToSortBy = RandomUtils.getRandomElementFromArray(['studio', 'actress', 'release', 'likes']);

    this.dataset.sort = fieldToSortBy;
    this.dataset.strategy = this.#strategy;
    this.dataset.areaMultiplier = String(areaMultiplier);

    const fragment = document.createDocumentFragment();
    flayList.sort(this.#compareFlay.bind(this)).forEach((flay) => {
      const shotCount = flay.video.likes?.length || 0;
      const flayMarker = new FlayMarker(flay, { shape: 'square', cover: true });
      flayMarker.classList.remove('shot');
      flayMarker.style.width = `${(shotCount + 1) * areaMultiplier}px`;
      if ([0, 1].includes(shotCount)) {
        flayMarker.style.opacity = `${(flay.video.rank || 8) * 0.125}`;
      }
      if ([0].includes(shotCount)) {
        flayMarker.style.filter = `blur(${6 - (flay.video.rank || 5)}px)`; // 백그라운드 이미지 흐리게 처리
      }
      fragment.appendChild(flayMarker);
    });
    this.appendChild(fragment);

    // PackUtils를 사용하여 패킹
    await this.#packUtils.pack(this as HTMLElement);

    this.childNodes.forEach((child) => {
      if (child instanceof HTMLElement) {
        // transitions에 opacity와 filter 이 있으면 제거
        const transitions = child.style.transition.split(',').filter((transition) => !transition.includes('opacity') && !transition.includes('filter'));
        transitions.push('opacity 0.5s ease-in-out', 'filter 0.5s ease-in-out');
        child.style.transition = transitions.join(',');
      }
    });
  }

  #compareFlay(f1: Flay, f2: Flay): number {
    switch (this.dataset.sort) {
      case 'likes':
        return (f2.video.likes?.length || 0) - (f1.video.likes?.length || 0);
      case 'actress':
        return f1.actressList[0]?.localeCompare(f2.actressList[0]) || 0;
      case 'studio':
        return f1.studio.localeCompare(f2.studio);
      default:
        return f1.release.localeCompare(f2.release);
    }
  }
}

customElements.define('flay-pack-panel', FlayPackPanel);
