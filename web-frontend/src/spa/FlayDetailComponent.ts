import { SpaComponent } from './SpaComponent';

/**
 * Flay 상세 정보를 표시하는 SPA 컴포넌트
 */
export class FlayDetailComponent extends SpaComponent {
  opus: string = '';
  private detailContainer: HTMLDivElement | null = null;

  static override get observedAttributes(): string[] {
    return ['data-opus'];
  }

  protected onInit(): void {
    this.setupTemplate();
    this.detailContainer = this.query<HTMLDivElement>('.flay-detail-container');

    const opus = this.getAttribute('data-opus');
    if (opus) {
      void this.loadFlayDetail(opus);
    }
  }

  protected override onAttributeChanged(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'data-opus' && newValue) {
      void this.loadFlayDetail(newValue);
    }
  }

  private setupTemplate(): void {
    this.render(`
      <div class="flay-detail-component">
        <div class="flay-detail-header">
          <button class="close-button">닫기</button>
        </div>
        <div class="flay-detail-container">
          <div class="loading">로딩 중...</div>
        </div>
      </div>
    `);

    const closeButton = this.query<HTMLButtonElement>('.close-button');
    if (closeButton) {
      this.addManagedEventListener(closeButton, 'click', () => this.close());
    }
  }

  private async loadFlayDetail(opus: string): Promise<void> {
    if (!this.detailContainer) return;

    this.opus = opus;
    this.detailContainer.innerHTML = '<div class="loading">로딩 중...</div>';

    try {
      // API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.detailContainer.innerHTML = `
        <div class="flay-detail-content">
          <h2>${opus}</h2>
          <div class="detail-info">
            <p><strong>제목:</strong> Sample Title for ${opus}</p>
            <p><strong>배우:</strong> Sample Actress</p>
            <p><strong>날짜:</strong> 2025-01-01</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load flay detail:', error);
      this.detailContainer.innerHTML = '<div class="error">로딩 실패</div>';
    }
  }

  private close(): void {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }
}

customElements.define('flay-detail', FlayDetailComponent);
