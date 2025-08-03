import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch from '@lib/FlayFetch';
import PackUtils, { PackStrategies, PackStrategy } from '@lib/PackUtils';
import RandomUtils from '@lib/RandomUtils';
import './FlayPackPanel.scss';

export class FlayPackPanel extends HTMLDivElement {
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
    const areaPercentage = this.#strategy === 'circle' ? 0.3 : 0.7; // 전체 화면의 70%를 사용
    const areaMultiplier = Math.round(Math.sqrt((window.innerWidth * window.innerHeight * areaPercentage) / totalShotSquared));

    const fragment = document.createDocumentFragment();
    flayList
      .sort((f1, f2) => {
        switch (this.#strategy) {
          case 'circle':
            return (f2.video.likes?.length || 0) - (f1.video.likes?.length || 0);
          case 'topLeft':
            return f2.release.localeCompare(f1.release);
          default:
            return f1.release.localeCompare(f2.release);
        }
      })
      .forEach((flay) => {
        const shotCount = flay.video.likes?.length || 0;
        if (shotCount < 0) return;

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
}

customElements.define('flay-pack-panel', FlayPackPanel, { extends: 'div' });
