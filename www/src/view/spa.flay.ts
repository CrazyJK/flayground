import '@lib/SseConnector';
import '@spa/FlayListComponent';
import type { FlayListComponent } from '@spa/FlayListComponent';
import '@spa/FlayListComponent.scss';
import './spa.flay.scss';

/**
 * SPA Flay 페이지 초기화
 */
class SpaFlayApp {
  private flayList: FlayListComponent | null = null;

  constructor() {
    this.init();
  }

  /**
   * 앱 초기화
   */
  private init(): void {
    this.setupComponents();
    this.setupEventListeners();
    console.log('SPA Flay App initialized');
  }

  /**
   * 컴포넌트 설정
   */
  private setupComponents(): void {
    // FlayListComponent 생성 및 DOM에 추가
    this.flayList = document.createElement('flay-list') as FlayListComponent;
    this.flayList.setAttribute('data-limit', '50');
    this.flayList.setAttribute('data-sort', 'desc');

    // body에 컴포넌트 추가
    document.body.appendChild(this.flayList);
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // Flay 선택 이벤트 리스너
    document.addEventListener('flay-select', ((e: CustomEvent) => {
      const { opus } = e.detail;
      console.log('Flay selected:', opus);
      this.handleFlaySelect(opus);
    }) as EventListener);

    // 전역 키보드 단축키
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Ctrl+R: 목록 새로고침
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        this.refreshFlayList();
      }
    });
  }

  /**
   * Flay 선택 핸들러
   */
  private handleFlaySelect(opus: string): void {
    console.log(`Opening flay detail for: ${opus}`);
    // 여기에 상세 페이지 열기 또는 모달 표시 로직 추가
    alert(`Selected Flay: ${opus}`);
  }

  /**
   * Flay 목록 새로고침
   */
  private refreshFlayList(): void {
    if (this.flayList) {
      console.log('Refreshing flay list...');
      this.flayList.refresh();
    }
  }

  /**
   * 특정 opus로 스크롤
   */
  public scrollToOpus(opus: string): void {
    if (this.flayList) {
      this.flayList.scrollToOpus(opus);
    }
  }
}

// 앱 실행
const app = new SpaFlayApp();

// 글로벌에 앱 인스턴스 노출 (디버깅용)
declare global {
  interface Window {
    spaFlayApp: SpaFlayApp;
  }
}
window.spaFlayApp = app;
