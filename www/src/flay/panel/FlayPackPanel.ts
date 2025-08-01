import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch from '@lib/FlayFetch';
import PackUtils from '@lib/PackUtils';
import RandomUtils from '@lib/RandomUtils';
import StyleUtils from '@lib/StyleUtils';
import './FlayPackPanel.scss';

export class FlayPackPanel extends HTMLDivElement {
  private packUtils: PackUtils;
  private isUpDown: boolean; // 패널이 위로 올라가는지 여부

  constructor(isUpDown: boolean = RandomUtils.getRandomBoolean()) {
    super();
    this.classList.add('flay-pack-panel');
    this.isUpDown = isUpDown;
  }

  connectedCallback() {
    this.packUtils = new PackUtils({ strategy: this.isUpDown ? 'topLeft' : 'bottomLeft', fixedContainer: true, animate: true });
    this.initializePanel();
  }

  disconnectedCallback() {
    this.packUtils.release();
  }

  private initializePanel(): void {
    this.packContent();
  }

  private async packContent(): Promise<void> {
    const fragment = document.createDocumentFragment();
    const flayList = await FlayFetch.getFlayAll();
    flayList
      .sort((f1, f2) => {
        if (RandomUtils.getRandomBoolean()) {
          return (f2.video.likes?.length || 0) - (f1.video.likes?.length || 0);
        } else {
          return f1.release.localeCompare(f2.release) * (this.isUpDown ? 1 : -1);
        }
      })
      .forEach((flay) => {
        const shotCount = flay.video.likes?.length || 0;
        if (shotCount < 0) return;

        const flayMarker = new FlayMarker(flay, { shape: 'square', cover: true });
        flayMarker.classList.remove('shot');
        flayMarker.style.width = `${StyleUtils.remToPx(shotCount + 1)}px`;
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
    await this.packUtils.pack(this as HTMLElement);

    this.childNodes.forEach((child) => {
      if (child instanceof HTMLElement) {
        child.style.transition += ', opacity 0.5s ease-in-out, filter 0.5s ease-in-out';
      }
    });
  }
}

customElements.define('flay-pack-panel', FlayPackPanel, { extends: 'div' });
