import FlayFetch from '@lib/FlayFetch';
import PackUtils from '@lib/PackUtils';
import FlayMarker from '@flay/domain/FlayMarker';
import './FlayPackPanel.scss';
import ApiClient from '../../lib/ApiClient';

export class FlayPackPanel extends HTMLDivElement {
  private packUtils: PackUtils;

  constructor() {
    super();
    this.classList.add('flay-pack-panel');
  }

  connectedCallback() {
    this.packUtils = new PackUtils({ gap: 0, padding: 10, strategy: 'bottomLeft' });
    this.initializePanel();
  }

  disconnectedCallback() {
    this.packUtils.release();
  }

  private initializePanel(): void {
    this.packContent();
  }

  private async packContent(): Promise<void> {
    const flayList = await FlayFetch.getFlayAll();
    flayList.forEach((flay) => {
      const flayMarker = new FlayMarker(flay, {});
      flayMarker.style.width = `${(flay.video.likes?.length * 2 || 1) * 15}px`;
      if (flay.video.likes?.length > 2) {
        flayMarker.style.backgroundImage = `url(${ApiClient.buildUrl(`/static/cover/${flay.opus}`)})`;
        flayMarker.classList.remove('shot');
      }
      this.appendChild(flayMarker);
    });

    // PackUtils를 사용하여 패킹
    this.packUtils.pack(this as HTMLElement);
  }
}

customElements.define('flay-pack-panel', FlayPackPanel, { extends: 'div' });
