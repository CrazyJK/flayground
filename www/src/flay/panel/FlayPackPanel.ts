import GroundFlay from '@base/GroundFlay';
import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import PackUtils, { PackStrategies, PackStrategy } from '@lib/PackUtils';
import RandomUtils from '@lib/RandomUtils';
import './FlayPackPanel.scss';

/**
 * Flay 콘텐츠를 다양한 패킹 전략으로 배치하는 패널 컴포넌트
 *
 * 각 Flay의 좋아요 수에 따라 크기를 조절하고,
 * 선택된 전략(circle, grid, spiral 등)에 따라 레이아웃을 구성합니다.
 */
export class FlayPackPanel extends GroundFlay {
  /** 패킹 유틸리티 인스턴스 */
  #packUtils: PackUtils;
  /** 패널의 배치 전략 */
  #strategy: PackStrategy;
  /** 애니메이션 여부 */
  #animate: boolean;

  /**
   * FlayPackPanel 생성자
   * @param strategy 패킹 전략 (기본값: 랜덤 선택)
   * @param animate 애니메이션 적용 여부 (기본값: true)
   */
  constructor(strategy: PackStrategy = RandomUtils.getRandomElementFromArray(PackStrategies), animate: boolean = true) {
    super();
    this.classList.add('flay-pack-panel');
    this.#strategy = strategy;
    this.#animate = animate;
    this.#packUtils = new PackUtils({ strategy: this.#strategy, fixedContainer: true, animate: this.#animate });
  }

  connectedCallback() {
    this.#initializePanel();
  }

  disconnectedCallback() {
    this.#packUtils.release();
  }

  /** 패널을 초기화합니다. */
  #initializePanel(): void {
    void this.#packContent();
  }

  /**
   * Flay 콘텐츠를 패킹하여 화면에 배치합니다.
   * 좋아요 수에 따라 크기를 조절하고, 선택된 정렬 기준으로 정렬한 후
   * 패킹 전략에 따라 레이아웃을 구성합니다.
   */
  async #packContent(): Promise<void> {
    const flayList = await FlayFetch.getFlayAll();

    const totalShotSquared = flayList.reduce((acc, flay) => acc + ((flay.video.likes?.length || 0) + 1) ** 2, 0);
    const areaPercentage = this.#strategy === 'circle' ? 0.33 : 0.75; // 사용할 화면 영역 비율
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
        flayMarker.style.filter = `blur(${6 - (flay.video.rank ?? 5)}px)`; // 랭크에 따라 흐림 효과 적용
      }
      fragment.appendChild(flayMarker);
    });
    this.appendChild(fragment);

    // PackUtils를 사용하여 패킹
    await this.#packUtils.pack(this as HTMLElement);

    this.childNodes.forEach((child) => {
      if (child instanceof HTMLElement) {
        // transition에서 opacity와 filter 속성 제거 후 다시 추가
        const transitions = child.style.transition.split(',').filter((transition) => !transition.includes('opacity') && !transition.includes('filter'));
        transitions.push('opacity 0.5s ease-in-out', 'filter 0.5s ease-in-out');
        child.style.transition = transitions.join(',');
      }
    });
  }

  /**
   * 두 Flay 객체를 비교하여 정렬 순서를 결정합니다.
   * @param f1 첫 번째 Flay 객체
   * @param f2 두 번째 Flay 객체
   * @returns 정렬 순서 (-1, 0, 1)
   */
  #compareFlay(f1: Flay, f2: Flay): number {
    switch (this.dataset.sort) {
      case 'likes':
        return (f2.video.likes?.length ?? 0) - (f1.video.likes?.length ?? 0);
      case 'actress':
        return (f1.actressList[0] ?? '').localeCompare(f2.actressList[0] ?? '');
      case 'studio':
        return f1.studio.localeCompare(f2.studio);
      default:
        return f1.release.localeCompare(f2.release);
    }
  }
}

customElements.define('flay-pack-panel', FlayPackPanel);
