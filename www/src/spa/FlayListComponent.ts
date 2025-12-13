import './FlayListComponent.scss';
import { SpaComponent } from './SpaComponent';

/**
 * Flay 목록을 표시하는 SPA 컴포넌트 샘플
 * @description SpaComponent를 상속받아 Flay 목록 기능을 구현합니다.
 */
export class FlayListComponent extends SpaComponent {
  private listContainer: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private loadButton: HTMLButtonElement | null = null;

  /**
   * 감시할 속성 목록
   */
  static override get observedAttributes(): string[] {
    return ['data-limit', 'data-sort'];
  }

  /**
   * 컴포넌트 초기화
   */
  protected onInit(): void {
    this.setupTemplate();
    this.setupElements();
    this.setupEventListeners();
    console.log('FlayListComponent initialized');
  }

  /**
   * DOM 연결 후 호출
   */
  protected override onConnected(): void {
    console.log('FlayListComponent connected to DOM');
  }

  /**
   * DOM 해제 전 호출
   */
  protected override onDisconnected(): void {
    console.log('FlayListComponent disconnected from DOM');
  }

  /**
   * 속성 변경 핸들러
   */
  protected override onAttributeChanged(name: string, oldValue: string | null, newValue: string | null): void {
    console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`);

    if (name === 'data-limit' && this.listContainer) {
      void this.loadFlayList();
    }
  }

  /**
   * HTML 템플릿 설정
   */
  private setupTemplate(): void {
    const template = `
      <div class="flay-list-component">
        <div class="flay-list-header">
          <h2>Flay List</h2>
          <div class="controls">
            <input type="text" class="search-input" placeholder="검색...">
            <button class="load-button">목록 로드</button>
          </div>
        </div>
        <div class="flay-list-container">
          <!-- Flay 항목들이 여기에 표시됩니다 -->
        </div>
      </div>
    `;
    this.render(template);
  }

  /**
   * DOM 요소 참조 설정
   */
  private setupElements(): void {
    this.listContainer = this.query<HTMLDivElement>('.flay-list-container');
    this.searchInput = this.query<HTMLInputElement>('.search-input');
    this.loadButton = this.query<HTMLButtonElement>('.load-button');
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    if (this.loadButton) {
      this.addManagedEventListener(this.loadButton, 'click', () => this.handleLoadClick());
    }

    if (this.searchInput) {
      this.addManagedEventListener(this.searchInput, 'input', (e) => this.handleSearchInput(e));
    }

    // 전역 키보드 이벤트
    this.addManagedEventListener(window, 'keydown', (e) => this.handleKeydown(e));
  }

  /**
   * 로드 버튼 클릭 핸들러
   */
  private handleLoadClick(): void {
    console.log('Load button clicked');
    void this.loadFlayList();
  }

  /**
   * 검색 입력 핸들러
   */
  private handleSearchInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    console.log('Search input:', target.value);
    this.filterFlayList(target.value);
  }

  /**
   * 키보드 이벤트 핸들러
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      console.log('Escape pressed');
      if (this.searchInput) {
        this.searchInput.value = '';
        this.filterFlayList('');
      }
    }
  }

  /**
   * Flay 목록 로드
   */
  private async loadFlayList(): Promise<void> {
    if (!this.listContainer) return;

    const limit = this.getAttribute('data-limit') ?? '20';

    // 로딩 상태 표시
    this.listContainer.innerHTML = '<div class="loading">로딩 중...</div>';

    try {
      // API 호출 시뮬레이션 (실제로는 FlayFetch 사용)
      await this.delay(500);

      // 샘플 데이터
      const items = Array.from({ length: parseInt(limit) }, (_, i) => ({
        opus: `OPUS-${String(i + 1).padStart(3, '0')}`,
        title: `Flay Title ${i + 1}`,
        actress: `Actress ${i + 1}`,
      }));

      this.renderFlayItems(items);
    } catch (error) {
      console.error('Failed to load flay list:', error);
      this.listContainer.innerHTML = '<div class="error">로딩 실패</div>';
    }
  }

  /**
   * Flay 항목 렌더링
   */
  private renderFlayItems(items: Array<{ opus: string; title: string; actress: string }>): void {
    if (!this.listContainer) return;

    const html = items
      .map(
        (item) => `
        <div class="flay-item" data-opus="${item.opus}">
          <div class="flay-opus">${item.opus}</div>
          <div class="flay-title">${item.title}</div>
          <div class="flay-actress">${item.actress}</div>
        </div>
      `
      )
      .join('');

    this.listContainer.innerHTML = html;

    // 각 항목에 클릭 이벤트 추가
    const flayItems = this.queryAll<HTMLDivElement>('.flay-item');
    flayItems.forEach((item) => {
      this.addManagedEventListener(item, 'click', () => {
        const opus = item.getAttribute('data-opus');
        console.log('Flay item clicked:', opus);
        this.dispatchFlaySelectEvent(opus);
      });
    });
  }

  /**
   * Flay 목록 필터링
   */
  private filterFlayList(searchTerm: string): void {
    const flayItems = this.queryAll<HTMLDivElement>('.flay-item');
    const lowerSearchTerm = searchTerm.toLowerCase();

    flayItems.forEach((item) => {
      const text = item.textContent?.toLowerCase() ?? '';
      const isMatch = text.includes(lowerSearchTerm);
      item.style.display = isMatch ? '' : 'none';
    });
  }

  /**
   * Flay 선택 커스텀 이벤트 발생
   */
  private dispatchFlaySelectEvent(opus: string | null): void {
    const event = new CustomEvent('flay-select', {
      detail: { opus },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * 유틸리티: 딜레이
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 공개 API: 외부에서 목록 새로고침
   */
  public refresh(): void {
    console.log('Refreshing flay list');
    void this.loadFlayList();
  }

  /**
   * 공개 API: 특정 opus로 스크롤
   */
  public scrollToOpus(opus: string): void {
    const item = this.query<HTMLDivElement>(`.flay-item[data-opus="${opus}"]`);
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      item.classList.add('highlight');
      setTimeout(() => item.classList.remove('highlight'), 2000);
    }
  }
}

// 커스텀 엘리먼트 등록
customElements.define('flay-list', FlayListComponent);
