import FlayFetch from '@lib/FlayFetch';
import PackUtils from '@lib/PackUtils';
import ApiClient from '@lib/ApiClient';
import FlayMarker from '@flay/domain/FlayMarker';
import './FlayPackPanel.scss';
import StyleUtils from '../../lib/StyleUtils';

export class FlayPackPanel extends HTMLDivElement {
  private packUtils: PackUtils;
  private isUpDown: boolean; // 패널이 위로 올라가는지 여부

  constructor(isUpDown: boolean = Math.random() < 0.5) {
    super();
    this.classList.add('flay-pack-panel');
    this.isUpDown = isUpDown;
  }

  connectedCallback() {
    this.packUtils = new PackUtils({ strategy: this.isUpDown ? 'topLeft' : 'bottomLeft', fixedContainer: true });
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
      .sort((a, b) => (this.isUpDown ? b.release.localeCompare(a.release) : a.release.localeCompare(b.release)))
      // .sort((a, b) => (b.video.likes?.length || 0) - (a.video.likes?.length || 0))
      .forEach((flay) => {
        const shotCount = flay.video.likes?.length || 0;
        if (shotCount < -1) return;

        const flayMarker = new FlayMarker(flay, { shape: 'square' });
        flayMarker.style.backgroundImage = `url(${ApiClient.buildUrl(`/static/cover/${flay.opus}`)})`;
        flayMarker.style.width = `${StyleUtils.remToPx(shotCount + 1)}px`;
        if (shotCount < 3) {
          // 백그라운드 이미지 흐리게 처리
          flayMarker.style.opacity = `${(flay.video.rank || 8) * 0.125}`;
          flayMarker.style.filter = `blur(${6 - (flay.video.rank || 5)}px)`;
        }
        flayMarker.classList.remove('shot');
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
